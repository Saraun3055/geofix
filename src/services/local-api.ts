import { api } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth'
import type {
  WorkerProfileDoc,
  ServiceRequestDoc,
  RatingDoc,
  VerificationQueueDoc,
  DisputeDoc,
  AuditLogDoc,
  UserDoc,
  GeoPointLike,
} from '@/lib/types'

/**
 * Local Express API (server/) — the `local-api` data mode.
 * Function signatures deliberately mirror the demo/Firebase branches so every
 * service + hook can call the same names regardless of `dataMode`.
 */

/* ──────────────────── Auth ──────────────────── */
export async function checkPhoneExists(phone: string): Promise<boolean> {
  try {
    const res = await api.post<{ exists?: boolean }>('/auth/phone-exists', { phone })
    return Boolean(res.exists)
  } catch {
    return false
  }
}

export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const res = await api.post<{ exists?: boolean }>('/auth/email-exists', { email })
    return Boolean(res.exists)
  } catch {
    return false
  }
}
type AuthResponse = { accessToken: string; user: UserDoc }

type RawUser = {
  id?: string
  uid?: string
  name?: string
  email?: string
  phone?: string
  role?: string
  createdAt?: string
  photoUrl?: string
}

function toUserDoc(u: RawUser): UserDoc {
  return {
    uid: (u.uid ?? u.id ?? '') as string,
    name: (u.name ?? '') as string,
    email: u.email as string | undefined,
    phone: u.phone as string | undefined,
    role: (u.role ?? 'customer') as UserDoc['role'],
    createdAt: (u.createdAt ?? new Date().toISOString()) as string,
  }
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  const res = await api.post<{ accessToken: string; user: RawUser }>('/auth/login', { email, password })
  return { accessToken: res.accessToken, user: toUserDoc(res.user) }
}

export async function apiSignup(input: {
  name: string
  email: string
  password: string
  role: 'customer' | 'worker'
  phone?: string
  categorySkills?: string[]
}): Promise<AuthResponse> {
  const res = await api.post<{ accessToken: string; user: RawUser }>('/auth/signup', input)
  return { accessToken: res.accessToken, user: toUserDoc(res.user) }
}

export async function apiLogout(): Promise<void> {
  try {
    await api.post<void>('/auth/logout')
  } catch {
    /* session already gone */
  }
}

export async function apiMe(): Promise<UserDoc | null> {
  try {
    const me = await api.get<RawUser>('/users/me')
    return toUserDoc(me)
  } catch {
    return null
  }
}

/* ──────────────────── Profile ──────────────────── */
export async function updateMyProfileApi(data: { name?: string; phone?: string }): Promise<UserDoc | null> {
  try {
    const updated = await api.patch<RawUser>('/users/me', data)
    return toUserDoc(updated)
  } catch {
    return null
  }
}

/* ──────────────────── Workers ──────────────────── */
export async function nearbyWorkers(params: {
  lat: number
  lng: number
  radiusKm: number
  category?: string | null
  excludeIds: string[]
}): Promise<WorkerProfileDoc[]> {
  const qs = new URLSearchParams({
    lat: String(params.lat),
    lng: String(params.lng),
    radiusKm: String(params.radiusKm),
  })
  if (params.category && params.category !== 'all') qs.set('category', params.category)
  if (params.excludeIds.length > 0) qs.set('excludeIds', params.excludeIds.join(','))
  return api.get<WorkerProfileDoc[]>(`/workers/nearby?${qs.toString()}`)
}

export async function getWorkerProfile(userId: string): Promise<WorkerProfileDoc | null> {
  try {
    return await api.get<WorkerProfileDoc>(`/workers/${encodeURIComponent(userId)}`)
  } catch {
    return null
  }
}

export async function getAllWorkers(): Promise<WorkerProfileDoc[]> {
  return api.get<WorkerProfileDoc[]>('/workers')
}

export async function setWorkerAvailability(userId: string, isOnline: boolean): Promise<WorkerProfileDoc> {
  return api.patch<WorkerProfileDoc>(`/workers/${encodeURIComponent(userId)}/availability`, { isOnline })
}

export async function updateWorkerProfileApi(
  userId: string,
  data: { categorySkills: string[]; availableSlots: { day: string; from: string; to: string }[] },
): Promise<WorkerProfileDoc> {
  return api.patch<WorkerProfileDoc>(`/workers/${encodeURIComponent(userId)}/profile`, data)
}

export async function submitWorkerVerification(userId: string, govIdUrl: string, name?: string): Promise<boolean> {
  try {
    await api.post<void>(`/workers/${encodeURIComponent(userId)}/verification`, { govIdUrl, name })
    return true
  } catch {
    return false
  }
}

/* ──────────────────── Requests ──────────────────── */
export async function createApiRequest(
  customerId: string,
  customerName: string,
  data: {
    category: string
    title: string
    description: string
    photoUrls: string[]
    location: GeoPointLike
    address?: string
    whatsappNumber?: string
  },
): Promise<string> {
  void customerId
  const res = await api.post<{ id?: string } | ServiceRequestDoc>('/requests', {
    customerName,
    category: data.category,
    title: data.title,
    description: data.description,
    photoUrls: data.photoUrls,
    location: { latitude: data.location.latitude, longitude: data.location.longitude },
    address: data.address,
    whatsappNumber: data.whatsappNumber,
  })
  if (res && typeof res === 'object' && 'id' in res && res.id) return res.id
  return String(Date.now())
}

export async function assignWorker(requestId: string, workerId: string, workerName: string): Promise<boolean> {
  try {
    await api.patch<void>(`/requests/${requestId}/assign`, { workerId, workerName })
    return true
  } catch {
    return false
  }
}

export async function acceptApiRequest(requestId: string, workerId: string): Promise<boolean> {
  try {
    await api.patch<void>(`/requests/${requestId}/accept`, { workerId })
    return true
  } catch {
    return false
  }
}

export async function rejectApiRequest(requestId: string, workerId: string): Promise<boolean> {
  try {
    await api.patch<void>(`/requests/${requestId}/reject`, { workerId })
    return true
  } catch {
    return false
  }
}

export async function updateJobProgressApi(
  requestId: string,
  status: 'on_the_way' | 'arrived' | 'in_progress',
  note?: string,
): Promise<boolean> {
  try {
    await api.patch<void>(`/requests/${requestId}/progress`, { status, note })
    return true
  } catch {
    return false
  }
}

export async function completeApiRequest(
  requestId: string,
  workerId: string,
  bill?: { productsCost: number; laborWage: number; note?: string },
): Promise<boolean> {
  try {
    await api.patch<void>(`/requests/${requestId}/complete`, {
      workerId,
      productsCost: bill?.productsCost,
      laborWage: bill?.laborWage,
      note: bill?.note,
    })
    return true
  } catch {
    return false
  }
}

export async function payForApiRequest(requestId: string, paymentMethod: 'cash' | 'upi'): Promise<boolean> {
  try {
    await api.post<void>(`/requests/${requestId}/pay`, { paymentMethod })
    return true
  } catch {
    return false
  }
}

export async function cancelApiRequest(requestId: string): Promise<boolean> {
  try {
    await api.patch<void>(`/requests/${requestId}/cancel`)
    return true
  } catch {
    return false
  }
}

export async function rateWorkerForRequest(
  requestId: string,
  workerId: string,
  customerId: string,
  customerName: string,
  rating: number,
  comment?: string,
): Promise<boolean> {
  try {
    await api.post<void>('/ratings', {
      requestId,
      workerId,
      customerId,
      customerName,
      rating,
      comment,
    })
    return true
  } catch {
    return false
  }
}

export async function raiseDispute(requestId: string, reason: string, description: string): Promise<boolean> {
  try {
    await api.post<void>(`/requests/${requestId}/dispute`, { reason, description })
    return true
  } catch {
    return false
  }
}

/* ──────────────────── Queries (hooks) ──────────────────── */
export async function getMyRequests(customerId: string): Promise<ServiceRequestDoc[]> {
  return api.get<ServiceRequestDoc[]>(`/requests/mine?customerId=${encodeURIComponent(customerId)}`)
}

export async function getWorkerIncoming(workerId: string): Promise<ServiceRequestDoc[]> {
  return api.get<ServiceRequestDoc[]>(`/requests/incoming?workerId=${encodeURIComponent(workerId)}`)
}

export async function getWorkerJobs(workerId: string): Promise<ServiceRequestDoc[]> {
  return api.get<ServiceRequestDoc[]>(`/requests/worker/${encodeURIComponent(workerId)}`)
}

export async function getRequestById(requestId: string): Promise<ServiceRequestDoc | null> {
  try {
    return await api.get<ServiceRequestDoc>(`/requests/${encodeURIComponent(requestId)}`)
  } catch {
    return null
  }
}

export async function getAllRequests(status?: string): Promise<ServiceRequestDoc[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : ''
  return api.get<ServiceRequestDoc[]>(`/admin/requests${qs}`)
}

export async function getRatingsForWorker(workerId: string): Promise<RatingDoc[]> {
  return api.get<RatingDoc[]>(`/ratings?workerId=${encodeURIComponent(workerId)}`)
}

/* ──────────────────── Admin ──────────────────── */
export async function getVerificationQueue(): Promise<VerificationQueueDoc[]> {
  return api.get<VerificationQueueDoc[]>('/admin/verification-queue?status=pending')
}

export async function reviewVerification(workerId: string, status: 'approved' | 'rejected'): Promise<boolean> {
  try {
    await api.patch<void>(`/admin/verification-queue/${encodeURIComponent(workerId)}`, { status })
    return true
  } catch {
    return false
  }
}

export async function getDisputes(statusFilter?: 'open' | 'resolved' | ''): Promise<DisputeDoc[]> {
  const status = statusFilter || 'all'
  return api.get<DisputeDoc[]>(`/admin/disputes?status=${status}`)
}

export async function resolveApiDispute(disputeId: string, resolutionNote: string): Promise<boolean> {
  try {
    await api.patch<void>(`/admin/disputes/${disputeId}`, { status: 'resolved', resolutionNote })
    return true
  } catch {
    return false
  }
}

export async function getAuditLog(): Promise<AuditLogDoc[]> {
  return api.get<AuditLogDoc[]>('/admin/audit-log')
}

export async function getAllApiUsers(): Promise<UserDoc[]> {
  const users = await api.get<Array<Record<string, unknown> & { id: string }>>('/admin/users')
  return users.map((u) => toUserDoc(u))
}

export async function setUserSuspended(uid: string, suspended: boolean): Promise<boolean> {
  try {
    await api.patch<void>(`/admin/users/${encodeURIComponent(uid)}/suspend`, { suspended })
    return true
  } catch {
    return false
  }
}

export type ActiveStats = { total: number; searching: number; pending: number; accepted: number }

export async function getActiveStats(): Promise<ActiveStats> {
  const s = await api.get<{ activeRequests: number; searching: number; pending: number; accepted: number }>(
    '/admin/stats/active',
  )
  return {
    total: s.activeRequests,
    searching: s.searching,
    pending: s.pending,
    accepted: s.accepted,
  }
}

export async function getRatingDistribution(): Promise<{ stars: number; count: number }[]> {
  return api.get<{ star: number; count: number }[]>('/admin/stats/ratings').then((rows) =>
    rows.map((r) => ({ stars: r.star, count: r.count })),
  )
}

/** Not part of the public API yet — simplifies store hydration after login. */
export function setApiSession(user: UserDoc): void {
  const store = useAuthStore.getState()
  store.setFromApi(user)
}