import { Router, type Response } from 'express'
import { User, toSafeUser } from '../models/User'
import { WorkerProfile } from '../models/WorkerProfile'
import { ServiceRequest } from '../models/ServiceRequest'
import { toRequestDoc } from '../models/ServiceRequest'
import { VerificationQueue, toVerificationQueueDoc } from '../models/VerificationQueue'
import { Dispute, toDisputeDoc } from '../models/Dispute'
import { AuditLog, toAuditLogDoc } from '../models/AuditLog'
import { Rating } from '../models/Rating'
import { logAudit } from '../utils/audit'
import { requireRole } from '../middleware/role'
import type { AuthRequest } from '../middleware/types'

const router = Router()

router.use(requireRole('admin'))

/**
 * Admin collections mirror the frontend `useAdmin*` hooks, keeping the same
 * polling-friendly GET endpoints the demo/local-api modes already use.
 */

/** GET /admin/requests?status= — every request, optional status filter. */
router.get('/requests', async (req: AuthRequest, res: Response) => {
  try {
    const status = typeof req.query.status === 'string' && req.query.status !== 'all' ? req.query.status : undefined
    const docs = status
      ? await ServiceRequest.find({ status }).sort({ createdAt: -1 }).lean()
      : await ServiceRequest.find().sort({ createdAt: -1 }).lean()
    res.json(docs.map((d) => toRequestDoc(d as never)))
  } catch {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

/** GET /admin/users — every user (customers + workers + admins). */
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean()
    res.json(users.map((u) => toSafeUser({ ...u, _id: u._id })))
  } catch {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

/** PATCH /admin/users/:id/suspend { suspended: boolean } — freeze/restore an account. */
router.patch('/users/:id/suspend', async (req: AuthRequest, res: Response) => {
  const { suspended } = req.body as { suspended?: boolean }
  try {
    if (typeof suspended !== 'boolean') {
      res.status(400).json({ message: 'suspended must be a boolean' })
      return
    }
    const user = await User.findByIdAndUpdate(req.params.id, { suspended }, { new: true }).lean()
    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }
    await logAudit({
      actorId: req.user!.id,
      actorRole: req.user!.role,
      action: suspended ? 'suspend_user' : 'restore_user',
      targetId: user._id.toString(),
    })
    res.json(toSafeUser({ ...user, _id: user._id }))
  } catch {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

/** GET /admin/verification-queue?status=[pending|approved|rejected] — default pending. */
router.get('/verification-queue', async (req: AuthRequest, res: Response) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : 'pending'
    const docs = await VerificationQueue.find({ status }).sort({ submittedAt: -1 }).lean()
    res.json(docs.map((d) => toVerificationQueueDoc(d)))
  } catch {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

/** PATCH /admin/verification-queue/:workerId { status: 'approved'|'rejected' } */
router.patch('/verification-queue/:workerId', async (req: AuthRequest, res: Response) => {
  const { status } = req.body as { status?: 'approved' | 'rejected' }
  try {
    if (!status || !['approved', 'rejected'].includes(status)) {
      res.status(400).json({ message: 'status must be approved or rejected' })
      return
    }
    const queueItem = await VerificationQueue.findOneAndUpdate(
      { workerId: req.params.workerId },
      { status, reviewedBy: req.user!.id, reviewedAt: new Date() },
      { new: true },
    ).lean()
    if (!queueItem) {
      res.status(404).json({ message: 'Verification request not found' })
      return
    }
    await WorkerProfile.findOneAndUpdate(
      { userId: req.params.workerId },
      { verificationStatus: status, govIdUrl: queueItem.govIdUrl },
    )
    await logAudit({
      actorId: req.user!.id,
      actorRole: req.user!.role,
      action: `verification_${status}`,
      targetId: req.params.workerId,
    })
    res.json(toVerificationQueueDoc(queueItem))
  } catch {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

/** GET /admin/disputes?status=[open|resolved|all] — default open. */
router.get('/disputes', async (req: AuthRequest, res: Response) => {
  try {
    const status = typeof req.query.status === 'string' && req.query.status !== 'all' ? req.query.status : undefined
    const docs = status
      ? await Dispute.find({ status }).sort({ createdAt: -1 }).lean()
      : await Dispute.find().sort({ createdAt: -1 }).lean()
    res.json(docs.map((d) => toDisputeDoc(d as never)))
  } catch {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

/** PATCH /admin/disputes/:id { status: 'resolved', resolutionNote } */
router.patch('/disputes/:id', async (req: AuthRequest, res: Response) => {
  const { status, resolutionNote } = req.body as { status?: string; resolutionNote?: string }
  try {
    if (!status || !['open', 'resolved'].includes(status)) {
      res.status(400).json({ message: 'status must be open or resolved' })
      return
    }
    const doc = await Dispute.findByIdAndUpdate(
      req.params.id,
      { status, resolutionNote: resolutionNote ?? '', resolvedAt: status === 'resolved' ? new Date() : null },
      { new: true },
    ).lean()
    if (!doc) {
      res.status(404).json({ message: 'Dispute not found' })
      return
    }
    await logAudit({
      actorId: req.user!.id,
      actorRole: req.user!.role,
      action: 'resolve_dispute',
      targetId: doc._id.toString(),
    })
    res.json(toDisputeDoc(doc as never))
  } catch {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

/** GET /admin/audit-log — recent admin actions. */
router.get('/audit-log', async (req: AuthRequest, res: Response) => {
  try {
    const docs = await AuditLog.find().sort({ timestamp: -1 }).limit(500).lean()
    res.json(docs.map((d) => toAuditLogDoc(d as never)))
  } catch {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

/** GET /admin/stats/active — dashboard counters (incl. status breakdown). */
router.get('/stats/active', async (req: AuthRequest, res: Response) => {
  try {
    const [totalUsers, totalWorkers, totalRequests, searching, pending, accepted, openDisputes, pendingVerifications] =
      await Promise.all([
        User.countDocuments(),
        WorkerProfile.countDocuments(),
        ServiceRequest.countDocuments(),
        ServiceRequest.countDocuments({ status: 'searching' }),
        ServiceRequest.countDocuments({ status: 'pending_worker_response' }),
        ServiceRequest.countDocuments({ status: 'accepted' }),
        Dispute.countDocuments({ status: 'open' }),
        VerificationQueue.countDocuments({ status: 'pending' }),
      ])
    res.json({
      totalUsers,
      totalWorkers,
      totalRequests,
      activeRequests: searching + pending + accepted,
      searching,
      pending,
      accepted,
      openDisputes,
      pendingVerifications,
    })
  } catch {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

/** GET /admin/stats/ratings — rating distribution histogram 1..5. */
router.get('/stats/ratings', async (req: AuthRequest, res: Response) => {
  try {
    const buckets = await Rating.aggregate<{ _id: number; count: number }>([
      { $group: { _id: { $round: ['$rating', 0] }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ])
    const histogram = [1, 2, 3, 4, 5].map((star) => ({
      star,
      count: buckets.find((b) => b._id === star)?.count ?? 0,
    }))
    res.json(histogram)
  } catch {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

export default router