import { Router, type Response } from 'express'
import { Rating, toRatingDoc } from '../models/Rating'
import { ServiceRequest } from '../models/ServiceRequest'
import { WorkerProfile } from '../models/WorkerProfile'
import { logAudit } from '../utils/audit'
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

/** POST /ratings — customer rates a worker after a completed request. */
router.post('/', requireRole('customer'), async (req: AuthRequest, res: Response) => {
  const { requestId, workerId, rating, comment } = req.body as {
    requestId?: string
    workerId?: string
    rating?: number
    comment?: string
  }
  try {
    const r = Math.round(Number(rating))
    if (!requestId || !workerId || !Number.isFinite(r) || r < 1 || r > 5) {
      res.status(400).json({ message: 'requestId, workerId and a 1-5 rating are required' })
      return
    }
    const request = await ServiceRequest.findById(requestId)
    if (!request) {
      res.status(404).json({ message: 'Request not found' })
      return
    }
    if (request.customerId !== req.user!.id) {
      res.status(403).json({ message: 'You can only rate your own requests' })
      return
    }
    if (request.paymentStatus !== 'paid') {
      res.status(409).json({ message: 'Please complete the payment before rating the worker' })
      return
    }
    const existing = await Rating.findOne({ requestId })
    if (existing) {
      res.status(409).json({ message: 'This request has already been rated' })
      return
    }

    const ratingDoc = await Rating.create({
      requestId,
      workerId,
      customerId: req.user!.id,
      customerName: req.body.customerName ?? '',
      rating: r,
      comment: comment ?? '',
    })

    request.ratingGiven = true
    request.status = 'completed'
    request.completedAt = new Date()
    request.updatedAt = new Date()
    await request.save()

    const worker = await WorkerProfile.findOne({ userId: workerId })
    if (worker) {
      // Read the CURRENT count first, then derive the new average and write
      // both fields together. Using the post-increment doc here double-counts
      // the old average (e.g. 5.0 over 1 rating + a 3 → 6.5 instead of 4.0).
      const prevTotal = (worker.rating ?? 0) * (worker.ratingCount ?? 0)
      const count = worker.ratingCount + 1
      const newRating = Math.min(5, Math.round(((prevTotal + r) / count) * 10) / 10)
      await WorkerProfile.updateOne({ userId: workerId }, { rating: newRating, ratingCount: count })
    }

    await logAudit({ actorId: req.user!.id, actorRole: req.user!.role, action: 'rate_worker', targetId: workerId })
    res.status(201).json(toRatingDoc({ ...ratingDoc.toObject(), _id: ratingDoc._id }))
  } catch {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

/** GET /ratings?workerId= — historical ratings for a worker. */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const workerId = typeof req.query.workerId === 'string' ? req.query.workerId : undefined
    const docs = workerId
      ? await Rating.find({ workerId }).sort({ createdAt: -1 }).limit(200).lean()
      : await Rating.find().sort({ createdAt: -1 }).limit(200).lean()
    res.json(docs.map((d) => toRatingDoc(d as typeof d & { _id: unknown })))
  } catch {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

export default router