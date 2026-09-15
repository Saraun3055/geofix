import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import rateLimit from 'express-rate-limit'
import { User, toSafeUser, type SafeUser } from '../models/User'
import { WorkerProfile } from '../models/WorkerProfile'
import { signAccessToken, signRefreshToken, verifyRefreshToken, refreshCookieOptions } from '../utils/token'
import { latLngToGeo, type LatLng } from '../utils/geo'
import { logAudit } from '../utils/audit'

const router = Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === 'production' ? 60 : 1000, // relaxed limit for dev/local testing
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again later' },
})

function authResponse(res: Response, userId: string, role: SafeUser['role'], user: SafeUser): void {
  const access = signAccessToken(userId, role)
  const refresh = signRefreshToken(userId, role)
  res.cookie('refreshToken', refresh, refreshCookieOptions())
  res.json({ accessToken: access, user })
}

/** Duplicate-key / validation → 409 / 400 with a friendly message. */
function handleWriteError(res: Response, e: unknown): void {
  const err = e as { code?: number; message?: string }
  if (err.code === 11000) {
    res.status(409).json({ message: 'An account with this email already exists' })
    return
  }
  if (err && typeof (err as { message?: string }).message === 'string') {
    res.status(400).json({ message: (err as { message: string }).message })
    return
  }
  res.status(500).json({ message: 'Something went wrong' })
}

router.post('/signup', authLimiter, async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, role, location, categorySkills } = req.body as {
      name: string
      email: string
      password: string
      phone?: string
      role?: 'customer' | 'worker'
      location?: LatLng
      categorySkills?: string[]
    }

    if (!name || !email || !password) {
      res.status(400).json({ message: 'Name, email and password are required' })
      return
    }
    if (password.length < 8) {
      res.status(400).json({ message: 'Password must be at least 8 characters' })
      return
    }
    const cleanRole = role === 'worker' ? 'worker' : 'customer'

    const existed = await User.findOne({ email: email.toLowerCase().trim() })
    if (existed) {
      res.status(409).json({ message: 'An account with this email already exists' })
      return
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      passwordHash,
      phone: phone ?? '',
      role: cleanRole,
    })

    // Worker profiles are created alongside the account (fixes role-less accounts)
    if (cleanRole === 'worker') {
      const coords: [number, number] = location?.longitude != null && location?.latitude != null
        ? [location.longitude, location.latitude]
        : [77.209, 28.6139]
      await WorkerProfile.create({
        userId: user._id.toString(),
        name,
        phone: phone ?? '',
        categorySkills: Array.isArray(categorySkills) ? [...new Set(categorySkills.map((s) => String(s).trim()).filter(Boolean))] : [],
        isOnline: false,
        verificationStatus: 'pending',
        location: latLngToGeo({ latitude: coords[1], longitude: coords[0] }),
      })
    }

    const safe = toSafeUser({ ...user.toObject(), _id: user._id })
    await logAudit({ actorId: safe.id, actorRole: safe.role, action: 'signup', targetId: safe.id })
    authResponse(res, user._id.toString(), safe.role, safe)
  } catch (e) {
    handleWriteError(res, e)
  }
})

router.post('/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string }
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' })
      return
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' })
      return
    }
    if (user.suspended) {
      res.status(403).json({ message: 'This account has been suspended' })
      return
    }

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) {
      res.status(401).json({ message: 'Invalid email or password' })
      return
    }

    const safe = toSafeUser({ ...user.toObject(), _id: user._id })
    await logAudit({ actorId: safe.id, actorRole: safe.role, action: 'login', targetId: safe.id })
    authResponse(res, user._id.toString(), safe.role, safe)
  } catch (e) {
    handleWriteError(res, e)
  }
})

router.post('/refresh', async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken as string | undefined
  if (!token) {
    res.status(401).json({ message: 'No refresh token' })
    return
  }

  try {
    const payload = verifyRefreshToken(token)
    const user = await User.findById(payload.sub)
    if (!user || user.suspended) {
      res.status(401).json({ message: 'Session expired' })
      return
    }

    const safe = toSafeUser({ ...user.toObject(), _id: user._id })
    authResponse(res, user._id.toString(), safe.role, safe)
  } catch {
    res.status(401).json({ message: 'Session expired' })
  }
})

router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('refreshToken', { ...refreshCookieOptions(), maxAge: undefined })
  res.status(204).end()
})

export default router