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

const EMAIL_RE = /^\S+@\S+\.\S+$/
const PHONE_RE = /^\+?[\d\s()-]{10,}$/
const PASSWORD_RE = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/

/** Normalise a phone number to digits only so (+91) 98765-43210 ≡ 9876543210. */
function phoneDigits(phone: string): string {
  return String(phone ?? '').replace(/\D/g, '')
}

function validateSignupInput(input: {
  name?: string
  email?: string
  password?: string
  phone?: string
  role?: 'customer' | 'worker'
  categorySkills?: string[]
}): { errors: Record<string, string> | null } {
  const errors: Record<string, string> = {}
  const name = typeof input.name === 'string' ? input.name.trim() : ''
  const email = typeof input.email === 'string' ? input.email.trim() : ''
  const password = typeof input.password === 'string' ? input.password : ''
  const phone = typeof input.phone === 'string' ? input.phone.trim() : ''
  const cleanRole = input.role === 'worker' ? 'worker' : 'customer'

  if (name.length < 2) errors.name = 'Full name must be at least 2 characters'
  if (email.length === 0 || !EMAIL_RE.test(email)) errors.email = 'Enter a valid email address'
  if (!PASSWORD_RE.test(password)) {
    errors.password = 'Password must be at least 8 characters with one uppercase letter, one number and one special character'
  }
  if (phone.length > 0 && !PHONE_RE.test(phone)) errors.phone = 'Enter a valid phone number (at least 10 digits)'
  if (cleanRole === 'worker' && (!Array.isArray(input.categorySkills) || input.categorySkills.length === 0)) {
    errors.skills = 'Select at least one skill'
  }

  return { errors: Object.keys(errors).length > 0 ? errors : null }
}

function validateLoginInput(input: {
  email?: string
  password?: string
}): { errors: Record<string, string> | null } {
  const errors: Record<string, string> = {}
  const email = typeof input.email === 'string' ? input.email.trim() : ''
  const password = typeof input.password === 'string' ? input.password : ''

  if (email.length === 0 || !EMAIL_RE.test(email)) errors.email = 'Enter a valid email address'
  if (password.length === 0) errors.password = 'Password is required'
  else if (password.length < 8) errors.password = 'Password must be at least 8 characters'

  return { errors: Object.keys(errors).length > 0 ? errors : null }
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

router.post('/phone-exists', authLimiter, async (req: Request, res: Response) => {
  try {
    const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : ''
    if (!phone || phoneDigits(phone).length < 10) {
      res.status(400).json({ message: 'A valid phone number is required' })
      return
    }
    // Store formats vary (spaces/dashes/+91), so compare digit-only.
    const users = await User.find({ phone: { $ne: '' } }).select('phone').lean()
    const exists = users.some((u) => phoneDigits(u.phone) === phoneDigits(phone))
    res.json({ exists })
  } catch {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

router.post('/email-exists', authLimiter, async (req: Request, res: Response) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    if (!email || !EMAIL_RE.test(email)) {
      res.status(400).json({ message: 'A valid email address is required' })
      return
    }
    const exists = await User.findOne({ email }).lean()
    res.json({ exists: !!exists })
  } catch {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

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
    const cleanRole = role === 'worker' ? 'worker' : 'customer'
    const { errors } = validateSignupInput({ name, email, password, phone, role: cleanRole, categorySkills })
    if (errors) {
      res.status(400).json({ message: 'Please fix the highlighted fields', errors })
      return
    }

    const existed = await User.findOne({ email: email.toLowerCase().trim() })
    if (existed) {
      res.status(409).json({ message: 'An account with this email already exists' })
      return
    }

    if (phone) {
      const usersWithPhone = await User.find({ phone: { $ne: '' } }).select('phone').lean()
      const phoneTaken = usersWithPhone.some((u) => phoneDigits(u.phone) === phoneDigits(phone))
      if (phoneTaken) {
        res.status(409).json({
          message: 'This phone number is already registered',
          errors: { contact: 'This phone number is already registered — try another number' },
        })
        return
      }
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
    const { errors } = validateLoginInput({ email, password })
    if (errors) {
      res.status(400).json({ message: 'Please fix the highlighted fields', errors })
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