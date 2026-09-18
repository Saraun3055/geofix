import { Router, type Response } from 'express'
import { WorkerProfile, toWorkerDoc } from '../models/WorkerProfile'
import { VerificationQueue } from '../models/VerificationQueue'
import { haversineMeters, type LatLng } from '../utils/geo'
import { requireRole } from '../middleware/role'
import type { AuthRequest } from '../middleware/types'

const router = Router()

router.use((req, res, next) => {
  const auth = req as AuthRequest
  if (!auth.user) {
    res.status(401).json({ message: 'Authentication required' })
    return
  }
  next()
})

/**
 * GET /workers/nearby?lat=&lng=&radiusKm=&category=&excludeIds=
 * Returns approved+online workers within `radiusKm`, sorted by rating (desc):
 *   - radius: clamped 1..200 km, default 10
 *   - category: optional; workers must match a category skill
 *   - excludeIds: comma-separated worker userIds to exclude
 * Each doc carries `_distance` (meters) for the client sort/display.
 */
router.get('/nearby', async (req: AuthRequest, res: Response) => {
  try {
    const lat = Number(req.query.lat)
    const lng = Number(req.query.lng)
    const radiusKm = Math.min(200, Math.max(1, Number(req.query.radiusKm) || 10))
    const category = typeof req.query.category === 'string' ? req.query.category : undefined
    const excludeIds = typeof req.query.excludeIds === 'string'
      ? req.query.excludeIds.split(',').filter(Boolean)
      : []

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      res.status(400).json({ message: 'lat and lng query params are required' })
      return
    }
    const center: LatLng = { latitude: lat, longitude: lng }

    const filter: Record<string, unknown> = { isOnline: true, verificationStatus: 'approved' }
    if (category && category !== 'all') filter.categorySkills = category
    if (excludeIds.length > 0) filter.userId = { $nin: excludeIds }

    const profiles = await WorkerProfile.find(filter).lean()
    const docs = profiles
      .map((p) => ({ p, dist: haversineMeters(center, { latitude: p.location!.coordinates[1], longitude: p.location!.coordinates[0] }) }))
      .filter(({ dist }) => dist <= radiusKm * 1000)
      .sort((a, b) => b.p.rating - a.p.rating || a.dist - b.dist)
      .map(({ p, dist }) => toWorkerDoc(p as typeof p & { _id: unknown }, Math.round(dist)))

    res.json(docs)
  } catch {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

/** GET /workers — all workers (optional ?status=approved). Used by admin + pickers. */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined
    const filter: Record<string, unknown> = {}
    if (status) filter.verificationStatus = status
    const profiles = await WorkerProfile.find(filter).sort({ rating: -1 }).lean()
    res.json(profiles.map((p) => toWorkerDoc(p as typeof p & { _id: unknown })))
  } catch {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

/** GET /workers/:userId — single worker profile by user id. */
router.get('/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const profile = await WorkerProfile.findOne({ userId: req.params.userId }).lean()
    if (!profile) {
      res.status(404).json({ message: 'Worker not found' })
      return
    }
    res.json(toWorkerDoc(profile as typeof profile & { _id: unknown }))
  } catch {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

/** PATCH /workers/:userId/availability — toggle isOnline (worker self-service). */
router.patch('/:userId/availability', requireRole('worker'), async (req: AuthRequest, res: Response) => {
  const { isOnline } = req.body as { isOnline?: boolean }
  try {
    if (req.user!.id !== req.params.userId) {
      res.status(403).json({ message: 'You can only update your own availability' })
      return
    }
    const profile = await WorkerProfile.findOneAndUpdate(
      { userId: req.params.userId },
      { isOnline: Boolean(isOnline) },
      { new: true },
    ).lean()
    if (!profile) {
      res.status(404).json({ message: 'Worker profile not found' })
      return
    }
    res.json(toWorkerDoc(profile as typeof profile & { _id: unknown }))
  } catch {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

/** PATCH /workers/:userId/profile — worker self-service: update skills + availability slots. */
router.patch('/:userId/profile', requireRole('worker'), async (req: AuthRequest, res: Response) => {
  const { categorySkills, availableSlots } = req.body as {
    categorySkills?: string[]
    availableSlots?: { day: string; from: string; to: string }[]
  }
  try {
    if (req.user!.id !== req.params.userId) {
      res.status(403).json({ message: 'You can only update your own profile' })
      return
    }
    const profile = await WorkerProfile.findOne({ userId: req.user!.id })
    if (!profile) {
      res.status(404).json({ message: 'Worker profile not found' })
      return
    }
    if (Array.isArray(categorySkills)) {
      profile.categorySkills = [...new Set(categorySkills.map((s) => String(s).trim()).filter(Boolean))]
    }
    if (Array.isArray(availableSlots)) {
      const VALID_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const timeRe = /^([01]?\d|2[0-3]):[0-5]\d$/
      const clean = availableSlots
        .map((s) => ({ day: String(s?.day ?? ''), from: String(s?.from ?? ''), to: String(s?.to ?? '') }))
        .filter((s) => VALID_DAYS.includes(s.day) && timeRe.test(s.from) && timeRe.test(s.to))
      profile.availableSlots = clean as typeof profile.availableSlots
    }
    profile.markModified('availableSlots')
    await profile.save()
    res.json(toWorkerDoc({ ...profile.toObject(), _id: profile._id }))
  } catch {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

/** POST /workers/:userId/verification — submit/update ID verification (worker self-service). */
router.post('/:userId/verification', requireRole('worker'), async (req: AuthRequest, res: Response) => {
  const { govIdUrl, name } = req.body as { govIdUrl?: string; name?: string }
  try {
    if (req.user!.id !== req.params.userId) {
      res.status(403).json({ message: 'You can only submit verification for yourself' })
      return
    }
    if (!govIdUrl) {
      res.status(400).json({ message: 'govIdUrl is required' })
      return
    }
    const profile = await WorkerProfile.findOneAndUpdate(
      { userId: req.params.userId },
      { govIdUrl, verificationStatus: 'pending' },
      { new: true },
    ).lean()
    if (!profile) {
      res.status(404).json({ message: 'Worker profile not found' })
      return
    }
    await VerificationQueue.updateOne(
      { workerId: req.params.userId },
      { workerId: req.params.userId, workerName: name ?? profile.name, govIdUrl, status: 'pending', submittedAt: new Date() },
      { upsert: true },
    )
    res.json({ ok: true })
  } catch {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

export default router