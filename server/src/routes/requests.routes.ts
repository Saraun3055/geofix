import { Router, type Response } from 'express'
import { ServiceRequest, toRequestDoc, type RequestDoc } from '../models/ServiceRequest'
import { WorkerProfile } from '../models/WorkerProfile'
import { Dispute, toDisputeDoc, type DisputeDoc } from '../models/Dispute'
import { latLngToGeo, parseLatLng, type LatLng } from '../utils/geo'
import { logAudit } from '../utils/audit'
import { requireRole } from '../middleware/role'
import type { AuthRequest } from '../middleware/types'

const router = Router()

/** Strict RBAC: only customers create service requests. */
router.post('/', requireRole('customer'), async (req: AuthRequest, res: Response) => {
  interface CreateBody {
    category: string
    title: string
    description: string
    photoUrls?: string[]
    location: LatLng
    address?: string
    pincode?: string
    area?: string
    whatsappNumber?: string
  }
  const body = req.body as CreateBody
  const loc = parseLatLng(body.location)

  try {
    if (!body.category || !body.title) {
      res.status(400).json({ message: 'category and title are required' })
      return
    }
    if (!loc) {
      res.status(400).json({ message: 'A valid location is required' })
      return
    }

    const doc = await ServiceRequest.create({
      customerId: req.user!.id,
      customerName: req.body.customerName ?? '',
      category: body.category,
      title: body.title,
      description: typeof body.description === 'string' ? body.description : '',
      photoUrls: Array.isArray(body.photoUrls) ? body.photoUrls : [],
      status: 'searching',
      customerLocation: latLngToGeo(loc),
      customerAddress: body.address ?? null,
      customerPincode: typeof body.pincode === 'string' ? body.pincode.slice(0, 6) : undefined,
      customerArea: typeof body.area === 'string' ? body.area : undefined,
      rejectedBy: [],
      whatsappNumber: body.whatsappNumber ?? null,
    })

    await logAudit({ actorId: req.user!.id, actorRole: req.user!.role, action: 'create_request', targetId: doc._id.toString() })
    res.status(201).json(toRequestDoc({ ...doc.toObject(), _id: doc._id }))
  } catch {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

/** GET /requests/mine — the caller's own requests (customers + admins). */
router.get('/mine', requireRole('customer', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    // Non-admin callers can only ever read their own requests.
    const customerId = req.user!.role === 'admin' && typeof req.query.customerId === 'string'
      ? req.query.customerId
      : req.user!.id
    const docs = await ServiceRequest.find({ customerId }).sort({ createdAt: -1 }).lean()
    res.json(docs.map((d) => toRequestDoc(d as typeof d & { _id: unknown })))
  } catch {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

/** GET /requests/incoming — requests awaiting a worker's response. */
router.get('/incoming', requireRole('worker'), async (req: AuthRequest, res: Response) => {
  try {
    const workerId = req.user!.id
    const docs = await ServiceRequest.find({
      workerId,
      status: 'pending_worker_response',
    })
      .sort({ updatedAt: -1 })
      .lean()
    res.json(docs.map((d) => toRequestDoc(d as typeof d & { _id: unknown })))
  } catch {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

/** GET /requests/worker/:workerId — completed/accepted jobs for worker history.
 *  Workers may only fetch their own history; admins may read anyone's. */
router.get('/worker/:workerId', requireRole('worker', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role === 'worker' && req.params.workerId !== req.user!.id) {
      res.status(403).json({ message: 'You do not have permission to perform this action' })
      return
    }
    const docs = await ServiceRequest.find({
      workerId: req.params.workerId,
      status: { $in: ['accepted', 'on_the_way', 'arrived', 'in_progress', 'completed'] },
    })
      .sort({ updatedAt: -1 })
      .lean()
    res.json(docs.map((d) => toRequestDoc(d as typeof d & { _id: unknown })))
  } catch {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

/** GET /requests/:id — live status of a single request (parties + admins only). */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const doc = await ServiceRequest.findById(String(req.params.id)).lean()
    if (!doc) {
      res.status(404).json({ message: 'Request not found' })
      return
    }
    const isParty = String(doc.customerId) === req.user!.id || String(doc.workerId ?? '') === req.user!.id
    if (req.user!.role !== 'admin' && !isParty) {
      res.status(403).json({ message: 'You do not have permission to perform this action' })
      return
    }
    res.json(toRequestDoc(doc as typeof doc & { _id: unknown }))
  } catch {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

/** Assign a worker candidate (customers assign to their own requests only). */
router.patch('/:id/assign', requireRole('customer'), async (req: AuthRequest, res: Response) => {
  const { workerId, workerName } = req.body as { workerId?: string; workerName?: string }
  try {
    if (!workerId) {
      res.status(400).json({ message: 'workerId is required' })
      return
    }
    const doc = await ServiceRequest.findById(req.params.id)
    if (!doc) {
      res.status(404).json({ message: 'Request not found' })
      return
    }
    if (doc.customerId !== req.user!.id) {
      res.status(403).json({ message: 'You can only assign a worker to your own request' })
      return
    }
    if (doc.status !== 'searching') {
      res.status(409).json({ message: 'This request is no longer searching for a worker' })
      return
    }
    if (doc.rejectedBy.includes(workerId)) {
      res.status(409).json({ message: 'This worker declined this request' })
      return
    }
    doc.workerId = workerId
    doc.workerName = workerName ?? null
    doc.status = 'pending_worker_response'
    doc.updatedAt = new Date()
    await doc.save()

    await WorkerProfile.updateOne({ userId: workerId }, { currentRequestId: doc._id.toString() })
    res.json(toRequestDoc({ ...doc.toObject(), _id: doc._id }))
  } catch {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

/** Worker accepts an incoming request assigned to them. */
router.patch('/:id/accept', requireRole('worker'), async (req: AuthRequest, res: Response) => {
  try {
    const doc = await ServiceRequest.findById(req.params.id)
    if (!doc) {
      res.status(404).json({ message: 'Request not found' })
      return
    }
    if (doc.workerId !== req.user!.id) {
      res.status(403).json({ message: 'This request was not assigned to you' })
      return
    }
    if (doc.status !== 'pending_worker_response') {
      res.status(409).json({ message: 'This request cannot be accepted right now' })
      return
    }
    const worker = await WorkerProfile.findOne({ userId: req.user!.id })
    doc.status = 'accepted'
    doc.acceptedAt = new Date()
    doc.updatedAt = new Date()
    doc.jobUpdates.push({ status: 'accepted', note: undefined, timestamp: new Date() })
    doc.workerName = worker?.name ?? doc.workerName
    doc.whatsappNumber = worker?.phone ?? doc.whatsappNumber
    doc.chatChannelId = `${doc.customerId}__${doc.workerId}`
    await doc.save()

    if (worker) {
      worker.currentRequestId = null
      worker.isOnline = false
      await worker.save()
    }
    res.json(toRequestDoc({ ...doc.toObject(), _id: doc._id }))
  } catch {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

/** Worker declines an incoming request assigned to them → re-queues it. */
router.patch('/:id/reject', requireRole('worker'), async (req: AuthRequest, res: Response) => {
  try {
    const doc = await ServiceRequest.findById(req.params.id)
    if (!doc) {
      res.status(404).json({ message: 'Request not found' })
      return
    }
    if (doc.workerId !== req.user!.id) {
      res.status(403).json({ message: 'This request was not assigned to you' })
      return
    }
    const rejectingId = req.user!.id
    doc.workerId = null
    doc.workerName = null
    if (!doc.rejectedBy.includes(rejectingId)) doc.rejectedBy.push(rejectingId)
    doc.status = 'searching'
    doc.updatedAt = new Date()
    await doc.save()

    await WorkerProfile.updateOne({ userId: rejectingId }, { currentRequestId: null })
    res.json(toRequestDoc({ ...doc.toObject(), _id: doc._id }))
  } catch {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

/** Worker advances their assigned job: accepted → on_the_way → arrived → in_progress. */
router.patch('/:id/progress', requireRole('worker'), async (req: AuthRequest, res: Response) => {
  const { status, note } = req.body as { status?: string; note?: string }
  const VALID_TRANSITION = new Map<string, string>([
    ['accepted', 'on_the_way'],
    ['on_the_way', 'arrived'],
    ['arrived', 'in_progress'],
  ])
  try {
    const doc = await ServiceRequest.findById(req.params.id)
    if (!doc) {
      res.status(404).json({ message: 'Request not found' })
      return
    }
    if (!doc.workerId || doc.workerId !== req.user!.id) {
      res.status(403).json({ message: 'Only the assigned worker can update this job' })
      return
    }
    if (!status || !Array.from(VALID_TRANSITION.values()).includes(status)) {
      res.status(400).json({ message: 'status must be on_the_way, arrived or in_progress' })
      return
    }
    if (VALID_TRANSITION.get(doc.status) !== status) {
      res.status(409).json({ message: `Cannot move this job from ${doc.status} to ${status}` })
      return
    }
    doc.status = status as RequestDoc['status']
    doc.updatedAt = new Date()
    doc.jobUpdates.push({
      status,
      note: typeof note === 'string' && note.trim() ? note.trim() : undefined,
      timestamp: new Date(),
    })
    await doc.save()
    res.json(toRequestDoc({ ...doc.toObject(), _id: doc._id }))
  } catch {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

/** Worker marks their assigned request complete and submits a bill. */
router.patch('/:id/complete', requireRole('worker'), async (req: AuthRequest, res: Response) => {
  const { productsCost, laborWage, note } = req.body as {
    productsCost?: number
    laborWage?: number
    note?: string
  }
  try {
    const doc = await ServiceRequest.findById(req.params.id)
    if (!doc) {
      res.status(404).json({ message: 'Request not found' })
      return
    }
    const completingWorkerId = req.user!.id
    if (!doc.workerId || doc.workerId !== completingWorkerId) {
      res.status(403).json({ message: 'Only the assigned worker can complete this request' })
      return
    }
    if (!['accepted', 'on_the_way', 'arrived', 'in_progress'].includes(doc.status)) {
      res.status(409).json({ message: 'This request is not in progress yet' })
      return
    }
    const products = Math.round(Number(productsCost))
    const labor = Math.round(Number(laborWage))
    if (!Number.isFinite(products) || !Number.isFinite(labor) || products < 0 || labor < 0) {
      res.status(400).json({ message: 'productsCost and laborWage must be non-negative numbers' })
      return
    }
    doc.status = 'completed'
    doc.completedAt = new Date()
    doc.updatedAt = new Date()
    doc.jobUpdates.push({
      status: 'completed',
      note: typeof note === 'string' && note.trim() ? note.trim() : undefined,
      timestamp: new Date(),
    })
    doc.bill = {
      productsCost: products,
      laborWage: labor,
      total: products + labor,
      createdAt: new Date(),
      ...(note ? { note: String(note) } : {}),
    }
    doc.paymentStatus = 'pending'
    doc.paymentMethod = null as never
    doc.paidAt = null
    await doc.save()

    await WorkerProfile.findOneAndUpdate({ userId: completingWorkerId }, { $inc: { jobsCompleted: 1 } })
    res.json(toRequestDoc({ ...doc.toObject(), _id: doc._id }))
  } catch {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

/** Customer pays the bill for their own request (cash / UPI). */
router.post('/:id/pay', requireRole('customer'), async (req: AuthRequest, res: Response) => {
  const { paymentMethod } = req.body as { paymentMethod?: 'cash' | 'upi' }
  try {
    const doc = await ServiceRequest.findById(req.params.id)
    if (!doc) {
      res.status(404).json({ message: 'Request not found' })
      return
    }
    if (doc.customerId !== req.user!.id) {
      res.status(403).json({ message: 'Only the customer can pay this bill' })
      return
    }
    if (doc.status !== 'completed') {
      res.status(409).json({ message: 'This request is not complete yet' })
      return
    }
    if (!doc.bill) {
      res.status(409).json({ message: 'The worker has not submitted a bill yet' })
      return
    }
    if (!paymentMethod || !['cash', 'upi'].includes(paymentMethod)) {
      res.status(400).json({ message: 'paymentMethod must be either cash or upi' })
      return
    }
    doc.paymentMethod = paymentMethod
    doc.paymentStatus = 'paid'
    doc.paidAt = new Date()
    doc.updatedAt = new Date()
    await doc.save()

    await logAudit({ actorId: req.user!.id, actorRole: req.user!.role, action: 'pay_request', targetId: doc._id.toString() })
    res.json(toRequestDoc({ ...doc.toObject(), _id: doc._id }))
  } catch {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

/** Customer cancels their own request — allowed until the job reaches completion. */
router.patch('/:id/cancel', requireRole('customer'), async (req: AuthRequest, res: Response) => {
  try {
    const doc = await ServiceRequest.findById(req.params.id)
    if (!doc) {
      res.status(404).json({ message: 'Request not found' })
      return
    }
    if (doc.customerId !== req.user!.id) {
      res.status(403).json({ message: 'You can only cancel your own requests' })
      return
    }
    if (
      !['searching', 'pending_worker_response', 'accepted', 'on_the_way', 'arrived', 'in_progress'].includes(doc.status)
    ) {
      res.status(409).json({ message: 'This request can no longer be cancelled' })
      return
    }
    doc.status = 'cancelled'
    doc.updatedAt = new Date()
    doc.jobUpdates.push({ status: 'cancelled', note: undefined, timestamp: new Date() })
    await doc.save()
    if (doc.workerId) await WorkerProfile.updateOne({ userId: doc.workerId }, { currentRequestId: null })
    res.json(toRequestDoc({ ...doc.toObject(), _id: doc._id }))
  } catch {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

/** POST /requests/:id/dispute — the customer or the assigned worker on this request. */
router.post('/:id/dispute', async (req: AuthRequest, res: Response) => {
  const { reason, description } = req.body as { reason?: string; description?: string }
  try {
    if (!reason) {
      res.status(400).json({ message: 'A dispute reason is required' })
      return
    }
    const doc = await ServiceRequest.findById(req.params.id)
    if (!doc) {
      res.status(404).json({ message: 'Request not found' })
      return
    }
    const isCustomer = String(doc.customerId) === req.user!.id
    const isWorker = String(doc.workerId ?? '') === req.user!.id
    if (!isCustomer && !isWorker) {
      res.status(403).json({ message: 'Only the customer or assigned worker can raise a dispute' })
      return
    }
    const raisedBy: DisputeDoc['raisedBy'] = isCustomer ? 'customer' : 'worker'
    const dispute = await Dispute.create({
      requestId: doc._id.toString(),
      raisedBy,
      reason,
      description: description ?? '',
      status: 'open',
    })
    await logAudit({
      actorId: req.user!.id,
      actorRole: req.user!.role,
      action: 'raise_dispute',
      targetId: dispute._id.toString(),
    })
    res.status(201).json(toDisputeDoc({ ...dispute.toObject(), _id: dispute._id }))
  } catch {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

export default router