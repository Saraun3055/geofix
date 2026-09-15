import { getDemoStore, persistDemoStore } from '@/lib/demo'
import { isLocalApi } from '@/lib/mode'
import * as localApi from '@/services/local-api'
import { toastSuccess, toastError } from '@/hooks/use-toast'

function isoNow() {
  return new Date().toISOString()
}

/* ─── Verification Queue ─────────────────────────────────── */
export async function approveWorkerVerification(workerId: string, reviewedBy: string): Promise<boolean> {
  if (isLocalApi) {
    const ok = await localApi.reviewVerification(workerId, 'approved')
    if (ok) toastSuccess('Approved', 'Worker verification approved')
    else toastError('Error', 'Could not approve verification')
    return ok
  }
  const store = getDemoStore()
  const item = store.verificationQueue.find((v) => v.workerId === workerId)
  if (item) { item.status = 'approved'; item.reviewedBy = reviewedBy; item.reviewedAt = isoNow() }
  const worker = store.workers.find((w) => w.userId === workerId)
  if (worker) worker.verificationStatus = 'approved'
  store.audit.unshift({ id: `a${Date.now()}`, actorId: reviewedBy, actorRole: 'superadmin', action: 'approved_worker', targetId: workerId, timestamp: isoNow() })
  persistDemoStore(store)
  toastSuccess('Approved', `Worker ${workerId} approved`)
  return true
}

export async function rejectWorkerVerification(workerId: string, reviewedBy: string): Promise<boolean> {
  if (isLocalApi) {
    const ok = await localApi.reviewVerification(workerId, 'rejected')
    if (ok) toastSuccess('Rejected', 'Worker verification rejected')
    else toastError('Error', 'Could not reject verification')
    return ok
  }
  const store = getDemoStore()
  const item = store.verificationQueue.find((v) => v.workerId === workerId)
  if (item) { item.status = 'rejected'; item.reviewedBy = reviewedBy; item.reviewedAt = isoNow() }
  const worker = store.workers.find((w) => w.userId === workerId)
  if (worker) worker.verificationStatus = 'rejected'
  store.audit.unshift({ id: `a${Date.now()}`, actorId: reviewedBy, actorRole: 'superadmin', action: 'rejected_verification', targetId: workerId, timestamp: isoNow() })
  persistDemoStore(store)
  toastSuccess('Rejected', `Worker ${workerId} rejected`)
  return true
}

/* ─── Disputes ──────────────────────────────────────────────── */
export async function resolveDispute(disputeId: string, resolutionNote: string, reviewedBy: string): Promise<boolean> {
  if (isLocalApi) {
    const ok = await localApi.resolveApiDispute(disputeId, resolutionNote)
    if (ok) toastSuccess('Resolved', 'Dispute resolved')
    else toastError('Error', 'Could not resolve dispute')
    return ok
  }
  const store = getDemoStore()
  const d = store.disputes.find((x) => x.id === disputeId)
  if (d) { d.status = 'resolved'; d.resolutionNote = resolutionNote; d.resolvedAt = isoNow() }
  store.audit.unshift({ id: `a${Date.now()}`, actorId: reviewedBy, actorRole: 'superadmin', action: 'resolved_dispute', targetId: disputeId, timestamp: isoNow() })
  persistDemoStore(store)
  toastSuccess('Resolved', 'Dispute resolved')
  return true
}

/* ─── User Management ─────────────────────────────────────── */
export async function suspendUser(uid: string, suspendedBy: string): Promise<boolean> {
  if (isLocalApi) {
    const ok = await localApi.setUserSuspended(uid, true)
    if (ok) toastSuccess('Suspended', 'User suspended')
    else toastError('Error', 'Could not suspend user')
    return ok
  }
  toastSuccess('Suspended', `User ${uid} suspended by ${suspendedBy} (demo)`)
  return true
}

export async function unsuspendUser(uid: string): Promise<boolean> {
  if (isLocalApi) {
    const ok = await localApi.setUserSuspended(uid, false)
    if (ok) toastSuccess('Unsuspended', 'User unsuspended')
    else toastError('Error', 'Could not restore user')
    return ok
  }
  toastSuccess('Unsuspended', `User ${uid} unsuspended (demo)`)
  return true
}