import {
  getDemoStore,
  persistDemoStore,
} from '@/lib/demo'
import { isLocalApi } from '@/lib/mode'
import * as localApi from '@/services/local-api'
import type {
  ServiceRequestDoc,
  RatingDoc,
  GeoPointLike,
  RequestStatus,
  JobProgressStatus,
} from '@/lib/types'

function isoNow() {
  return new Date().toISOString()
}

export async function createRequest(
  customerId: string,
  customerName: string,
  data: {
    category: string
    title: string
    description: string
    photoUrls: string[]
    location: GeoPointLike
    address?: string
    pincode?: string
    area?: string
    whatsappNumber?: string
  },
): Promise<string> {
  if (isLocalApi) return localApi.createApiRequest(customerId, customerName, data)

  const store = getDemoStore()
  const id = `r${Date.now()}`
  const newReq: ServiceRequestDoc = {
    id,
    customerId,
    customerName,
    category: data.category,
    title: data.title,
    description: data.description,
    photoUrls: data.photoUrls,
    status: 'searching',
    customerLocation: { latitude: data.location.latitude, longitude: data.location.longitude },
    customerAddress: data.address,
    customerPincode: data.pincode,
    customerArea: data.area,
    rejectedBy: [],
    createdAt: isoNow(),
  }
  store.requests.unshift(newReq)
  persistDemoStore(store)
  return id
}

export async function requestWorker(
  requestId: string,
  workerId: string,
  workerName: string,
): Promise<boolean> {
  if (isLocalApi) return localApi.assignWorker(requestId, workerId, workerName)

  const store = getDemoStore()
  const req = store.requests.find((r) => r.id === requestId)
  if (!req) return false
  if (req.status !== 'searching') return false
  req.workerId = workerId
  req.workerName = workerName
  req.status = 'pending_worker_response'
  req.updatedAt = isoNow()
  persistDemoStore(store)
  return true
}

export async function acceptRequest(requestId: string, workerId: string): Promise<boolean> {
  if (isLocalApi) return localApi.acceptApiRequest(requestId, workerId)

  const store = getDemoStore()
  const req = store.requests.find((r) => r.id === requestId)
  if (!req) return false
  req.status = 'accepted'
  req.acceptedAt = isoNow()
  req.updatedAt = isoNow()
  req.chatChannelId = `${req.customerId}__${workerId}`
  req.jobUpdates = [
    ...(req.jobUpdates ?? []),
    { status: 'accepted', timestamp: isoNow() },
  ]
  const worker = store.workers.find((w) => w.userId === workerId)
  req.whatsappNumber = worker?.phone ?? req.whatsappNumber
  persistDemoStore(store)
  return true
}

export async function rejectRequest(requestId: string, workerId: string): Promise<boolean> {
  if (isLocalApi) return localApi.rejectApiRequest(requestId, workerId)

  const store = getDemoStore()
  const req = store.requests.find((r) => r.id === requestId)
  if (!req) return false
  req.status = 'searching'
  req.workerId = undefined
  req.workerName = undefined
  req.rejectedBy = [...(req.rejectedBy ?? []), workerId]
  req.updatedAt = isoNow()
  persistDemoStore(store)
  return true
}

const PROGRESS_ORDER: RequestStatus[] = ['accepted', 'on_the_way', 'arrived', 'in_progress']

export async function updateJobProgress(
  requestId: string,
  status: JobProgressStatus,
  note?: string,
): Promise<boolean> {
  if (isLocalApi) return localApi.updateJobProgressApi(requestId, status, note)

  const store = getDemoStore()
  const req = store.requests.find((r) => r.id === requestId)
  if (!req) return false
  const currentIdx = PROGRESS_ORDER.indexOf(req.status)
  const nextIdx = PROGRESS_ORDER.indexOf(status)
  if (currentIdx === -1 || nextIdx !== currentIdx + 1) return false
  req.status = status
  req.updatedAt = isoNow()
  req.jobUpdates = [...(req.jobUpdates ?? []), { status, note: note?.trim() || undefined, timestamp: isoNow() }]
  persistDemoStore(store)
  return true
}

export async function markCompleted(
  requestId: string,
  workerId: string,
  bill: { productsCost: number; laborWage: number; note?: string },
): Promise<boolean> {
  if (isLocalApi) return localApi.completeApiRequest(requestId, workerId, bill)

  const store = getDemoStore()
  const req = store.requests.find((r) => r.id === requestId)
  if (!req) return false
  const productsCost = Math.max(0, Math.round(Number(bill.productsCost) || 0))
  const laborWage = Math.max(0, Math.round(Number(bill.laborWage) || 0))
  req.status = 'completed'
  req.completedAt = isoNow()
  req.updatedAt = isoNow()
  req.jobUpdates = [
    ...(req.jobUpdates ?? []),
    { status: 'completed', note: bill.note?.trim() || undefined, timestamp: isoNow() },
  ]
  req.bill = {
    productsCost,
    laborWage,
    total: productsCost + laborWage,
    note: bill.note?.trim() || undefined,
    createdAt: isoNow(),
  }
  req.paymentStatus = 'pending'
  persistDemoStore(store)
  return true
}

export async function payForRequest(requestId: string, paymentMethod: 'cash' | 'upi'): Promise<boolean> {
  if (isLocalApi) return localApi.payForApiRequest(requestId, paymentMethod)

  const store = getDemoStore()
  const req = store.requests.find((r) => r.id === requestId)
  if (!req || req.status !== 'completed' || !req.bill || req.paymentStatus === 'paid') return false
  req.paymentStatus = 'paid'
  req.paymentMethod = paymentMethod
  req.paidAt = isoNow()
  req.updatedAt = isoNow()
  persistDemoStore(store)
  return true
}

export async function raiseDispute(requestId: string, reason: string, description: string): Promise<boolean> {
  if (isLocalApi) return localApi.raiseDispute(requestId, reason, description)

  const store = getDemoStore()
  const req = store.requests.find((r) => r.id === requestId)
  if (!req) return false
  const now = isoNow()
  store.disputes.unshift({
    id: `d${Date.now()}`,
    requestId,
    raisedBy: 'customer',
    reason,
    description,
    status: 'open',
    createdAt: now,
  })
  persistDemoStore(store)
  return true
}

export async function rateWorker(
  requestId: string,
  workerId: string,
  customerId: string,
  customerName: string,
  rating: number,
  comment?: string,
): Promise<boolean> {
  if (isLocalApi) return localApi.rateWorkerForRequest(requestId, workerId, customerId, customerName, rating, comment)

  const store = getDemoStore()
  const req = store.requests.find((r) => r.id === requestId)
  if (req) {
    req.ratingGiven = true
    req.status = 'completed'
    req.completedAt = req.completedAt ?? isoNow()
  }
  const newRating: RatingDoc = {
    id: `rt${Date.now()}`,
    requestId,
    workerId,
    customerId,
    customerName,
    rating,
    comment,
    createdAt: isoNow(),
  }
  store.ratings.unshift(newRating)
  // Update worker rating (max is 5 — clamp defensively)
  const worker = store.workers.find((w) => w.userId === workerId)
  if (worker) {
    const totalRating = worker.rating * worker.ratingCount + rating
    worker.ratingCount += 1
    worker.rating = Math.min(5, Math.round((totalRating / worker.ratingCount) * 10) / 10)
  }
  persistDemoStore(store)
  return true
}

export async function cancelRequest(requestId: string): Promise<boolean> {
  if (isLocalApi) return localApi.cancelApiRequest(requestId)

  const store = getDemoStore()
  const req = store.requests.find((r) => r.id === requestId)
  if (req) {
    req.status = 'cancelled'
    req.updatedAt = isoNow()
    persistDemoStore(store)
  }
  return true
}