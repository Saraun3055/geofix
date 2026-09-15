/* ──────────────────── Auth / Users ──────────────────── */
export type UserRole = 'customer' | 'worker' | 'admin'
export type AdminRole = 'superadmin' | 'support'

export interface GeoPointLike {
  latitude: number
  longitude: number
}

export interface UserDoc {
  uid: string
  name: string
  email?: string
  phone?: string
  role: UserRole
  avatarUrl?: string
  suspended?: boolean
  createdAt: string
}

/* ──────────────────── Workers ──────────────────────── */
export type WorkerVerificationStatus = 'pending' | 'approved' | 'rejected'

export interface AvailabilitySlot {
  day: string
  from: string
  to: string
}

export interface WorkerProfileDoc {
  userId: string
  name: string
  phone: string
  categorySkills: string[]
  rating: number
  ratingCount: number
  jobsCompleted: number
  isOnline: boolean
  address?: string
  bio?: string
  avgResponseMin?: number
  govIdUrl?: string
  verificationStatus: WorkerVerificationStatus
  availableSlots: AvailabilitySlot[]
  g: { geohash: string; geopoint: GeoPointLike }
  /** Pre-computed distance in metres (client-side only) */
  _distance?: number
}

/* ──────────────────── Requests ─────────────────────── */
export type RequestStatus =
  | 'searching'
  | 'pending_worker_response'
  | 'accepted'
  | 'rejected'
  | 'completed'
  | 'cancelled'

export type PaymentMethod = 'cash' | 'upi'
export type PaymentStatus = 'pending' | 'paid'

export interface BillDoc {
  productsCost: number
  laborWage: number
  total: number
  note?: string
  createdAt?: string
}

export interface ServiceRequestDoc {
  id: string
  customerId: string
  customerName?: string
  workerId?: string
  workerName?: string
  category: string
  title: string
  description: string
  photoUrls: string[]
  status: RequestStatus
  customerLocation: GeoPointLike
  customerAddress?: string
  rejectedBy: string[]
  ratingGiven?: boolean
  whatsappNumber?: string
  chatChannelId?: string
  bill?: BillDoc
  paymentMethod?: PaymentMethod
  paymentStatus?: PaymentStatus
  paidAt?: string
  createdAt: string
  acceptedAt?: string
  completedAt?: string
  updatedAt?: string
}

/* ──────────────────── Ratings ──────────────────────── */
export interface RatingDoc {
  id: string
  requestId: string
  workerId: string
  customerId: string
  customerName?: string
  rating: number
  comment?: string
  createdAt: string
}

/* ──────────────────── Admin Collections ────────────── */
export interface AdminDoc {
  uid: string
  name: string
  email: string
  role: AdminRole
  createdAt?: string
}

export type VerificationQueueStatus = 'pending' | 'approved' | 'rejected'

export interface VerificationQueueDoc {
  workerId: string
  workerName?: string
  govIdUrl: string
  submittedAt: string
  status: VerificationQueueStatus
  reviewedBy?: string
  reviewedAt?: string
}

export type DisputeStatus = 'open' | 'resolved'

export interface DisputeDoc {
  id: string
  requestId: string
  raisedBy: 'customer' | 'worker'
  reason: string
  description: string
  status: DisputeStatus
  resolutionNote?: string
  createdAt: string
  resolvedAt?: string
}

export interface AuditLogDoc {
  id: string
  actorId: string
  actorRole: string
  action: string
  targetId: string
  timestamp: string
}

/* ──────────────────── App-specific helpers ─────────── */
export const CATEGORY_LIST = [
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Painting',
  'Appliance',
  'Locksmith',
  'AC / HVAC',
  'General',
] as const

export type ServiceCategory = (typeof CATEGORY_LIST)[number]

export const STATUS_LABEL: Record<RequestStatus, string> = {
  searching: 'Searching for a worker',
  pending_worker_response: 'Worker notified',
  accepted: 'Worker on the way',
  rejected: 'Worker declined',
  completed: 'Job completed',
  cancelled: 'Cancelled',
}

export const STATUS_COLOR: Record<RequestStatus, string> = {
  searching: 'bg-amber-100 text-amber-800',
  pending_worker_response: 'bg-blue-100 text-blue-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-stone-200 text-stone-600',
}

export const VERIFICATION_LABEL: Record<VerificationQueueStatus, string> = {
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
}

export const DISPUTE_LABEL: Record<DisputeStatus, string> = {
  open: 'Open',
  resolved: 'Resolved',
}