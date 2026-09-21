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
  adminRole?: AdminRole
  avatarUrl?: string
  /** Home pincode (6-digit) from the Madurai dataset. */
  pincode?: string
  /** Home area name from the Madurai dataset. */
  area?: string
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
  /** Home/service pincode (6-digit) from the Madurai lookup dataset. */
  pincode?: string
  /** Home/service area name from the Madurai lookup dataset. */
  area?: string
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
  | 'on_the_way'
  | 'arrived'
  | 'in_progress'
  | 'rejected'
  | 'completed'
  | 'cancelled'

export type JobProgressStatus = 'on_the_way' | 'arrived' | 'in_progress'

export interface JobUpdateDoc {
  status: RequestStatus
  note?: string
  timestamp: string
}

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
  jobUpdates?: JobUpdateDoc[]
  customerLocation: GeoPointLike
  customerAddress?: string
  /** Pincode (6-digit) resolved from the Madurai dataset for this request. */
  customerPincode?: string
  /** Area name resolved from the Madurai dataset for this request. */
  customerArea?: string
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

export const SUBCATEGORIES_MAP: Record<ServiceCategory, string[]> = {
  Electrical: [
    'Fan not working / making noise',
    'Switchboard / Socket repair',
    'Short circuit & sparking fix',
    'Light fixture installation',
    'MCB Tripping / Main Board issue',
  ],
  Plumbing: [
    'Leaking tap / faucet',
    'Blocked drain / pipe overflow',
    'Flush tank / Toilet repair',
    'Water heater / Geyser installation',
    'Water tank leakage',
  ],
  'AC / HVAC': [
    'AC not cooling / low airflow',
    'Gas refill & leak repair',
    'AC filter & coil cleaning',
    'Water leaking from indoor unit',
    'AC noise / compressor issue',
  ],
  Carpentry: [
    'Door lock & latch repair',
    'Cabinet / Drawer hinge fixing',
    'Furniture assembly / repair',
    'Bed frame / Wooden table fix',
  ],
  Painting: [
    'Touch-up / Single wall painting',
    'Full room repainting',
    'Dampness & seepage treatment',
  ],
  Appliance: [
    'Washing machine not spinning',
    'Refrigerator not cooling',
    'Microwave oven repair',
    'RO water purifier filter change',
  ],
  Locksmith: [
    'Emergency door lockout',
    'New lock installation',
    'Key duplication & cylinder change',
  ],
  General: [
    'Drilling & hanging items',
    'General home maintenance',
    'Curtain rod installation',
  ],
}

export const STATUS_LABEL: Record<RequestStatus, string> = {
  searching: 'Searching for a worker',
  pending_worker_response: 'Worker notified',
  accepted: 'Worker on the way',
  on_the_way: 'On the way',
  arrived: 'Worker arrived',
  in_progress: 'Work in progress',
  rejected: 'Worker declined',
  completed: 'Job completed',
  cancelled: 'Cancelled',
}

export const STATUS_COLOR: Record<RequestStatus, string> = {
  searching: 'bg-stone-100 text-stone-600',
  pending_worker_response: 'bg-amber-100 text-amber-800',
  accepted: 'bg-sage-100 text-sage-700',
  on_the_way: 'bg-caramel-100 text-caramel-800',
  arrived: 'bg-amber-200/70 text-amber-900',
  in_progress: 'bg-stone-200 text-stone-700',
  rejected: 'bg-rust-100 text-rust-800',
  completed: 'bg-sage-100 text-sage-700',
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