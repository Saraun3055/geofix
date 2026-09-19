import {
  type WorkerProfileDoc,
  type ServiceRequestDoc,
  type RatingDoc,
  type VerificationQueueDoc,
  type DisputeDoc,
  type AuditLogDoc,
  type ServiceCategory,
  type GeoPointLike,
  type JobUpdateDoc,
  type RequestStatus,
  CATEGORY_LIST,
} from './types'
import { encodeGeohash } from './geo'
import { MADURAI_LOCATIONS, formatLocation, type MaduraiLocation } from './madurai-locations'

const CATEGORIES: ServiceCategory[] = [...CATEGORY_LIST]
const NAMES_C = ['Aisha Patel', 'Marco Rivera', 'Liam Chen', 'Fatima Al-Hassan', 'Chloe Dubois', 'Samuel Okafor', 'Priya Nair', 'Noah Lindqvist', 'Zara Shah', 'Theo Martin']
const NAMES_W = ['Rajan Kumar', 'Yusuf Idris', 'Miguel Santos', 'Ravi Sharma', 'Jamal Benson', 'Anna Nowak', 'Diego Morales', 'Hassan Patel', 'Luca Bertoni', 'Tariq Osman']
const REVIEWS = [
  'Very professional, fixed the leak quickly.',
  'Great work! Arrived on time and cleaned up after.',
  'Fair pricing and honest communication.',
  'Fast response. Highly recommended.',
  'Knew exactly what to do. Will use again.',
  'Took a bit longer than expected but quality was good.',
  'Excellent worker. Will definitely book again.',
  'Friendly and efficient. A lifesaver!',
  '',
  '',
]

function randItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

/** Deterministically pick a Madurai region so demo data looks real but stable. */
function seedLocation(index: number): MaduraiLocation {
  return MADURAI_LOCATIONS[(index * 31 + 5) % MADURAI_LOCATIONS.length]!
}

function locationToGeoPoint(loc: MaduraiLocation): GeoPointLike {
  return { latitude: loc.lat, longitude: loc.lng }
}

function randomRating() {
  return Math.round((3.5 + Math.random() * 1.5) * 10) / 10
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Deterministic weekly availability so offline workers still show a "next available" slot. */
function availabilityFor(index: number) {
  const first = DAYS[(index + 1) % 7]!
  const second = DAYS[(index + 4) % 7]!
  if (index % 4 === 3) return [{ day: first, from: '09:00', to: '13:00' }]
  return [
    { day: first, from: '09:00', to: '13:00' },
    { day: second, from: '16:00', to: '20:00' },
  ]
}

function isoAgo(min: number) {
  return new Date(Date.now() - min * 60_000).toISOString()
}

/** Requests sprinkled across the last two weeks so admin analytics look real. */
function createdAgo(index: number) {
  if (index < 3) return isoAgo(8 + index * 4) // actively searching
  if (index < 5) return isoAgo(25 + index * 8) // pending worker response
  if (index < 10) return isoAgo(60 + index * 30) // accepted
  return isoAgo((index - 7) * 26 + 60 * 24) // completed, spread over ~13 days
}
function completedAgo(index: number) {
  return index < 10 ? isoAgo(5 + index * 30) : isoAgo(index * 90)
}

/* ── Demo state manager (localStorage-backed) ────────────────── */
const LS_KEY = 'geofix-demo-store'
type DemoStore = {
  workers: WorkerProfileDoc[]
  requests: ServiceRequestDoc[]
  ratings: RatingDoc[]
  disputes: DisputeDoc[]
  audit: AuditLogDoc[]
  verificationQueue: VerificationQueueDoc[]
}

function loadDemoStore(): DemoStore {
  const raw = localStorage.getItem(LS_KEY)
  if (raw) return JSON.parse(raw) as DemoStore
  const store = generateDemoData()
  localStorage.setItem(LS_KEY, JSON.stringify(store))
  return store
}

function saveDemoStore(store: DemoStore) {
  localStorage.setItem(LS_KEY, JSON.stringify(store))
}

function generateDemoData(): DemoStore {
  const workers: WorkerProfileDoc[] = NAMES_W.map((name, i) => {
    const loc = seedLocation(i * 3)
    return {
      userId: `w${i}`,
      name,
      phone: `+91${9000000000 + i}`,
      categorySkills: [CATEGORIES[i % CATEGORIES.length]!, CATEGORIES[(i + 2) % CATEGORIES.length]!],
      rating: randomRating(),
      ratingCount: 8 + Math.floor(Math.random() * 40),
      jobsCompleted: 15 + Math.floor(Math.random() * 80),
      isOnline: i === 0 || i === 1 || i === 4 || i === 5 ? true : Math.random() > 0.3,
      address: formatLocation(loc),
      pincode: loc.pincode,
      area: loc.name,
      bio: 'Experienced professional with a focus on quality.',
      avgResponseMin: 3 + Math.floor(Math.random() * 12),
      verificationStatus: i < 8 ? 'approved' : i === 8 ? 'pending' : 'rejected',
      availableSlots: availabilityFor(i),
      g: {
        geohash: encodeGeohash(loc.lat, loc.lng),
        geopoint: locationToGeoPoint(loc),
      },
    }
  })

  const requests: ServiceRequestDoc[] = Array.from({ length: 18 }, (_, i) => {
    // Deterministic assignments so the first demo worker (w0) always has:
    // one incoming request to accept (r3), one job in progress (r5),
    // and one completed job with ratings (r10).
    let worker: WorkerProfileDoc | undefined
    if (i < 3) {
      worker = undefined // searching — waiting for a customer to pick someone
    } else if (i < 5) {
      worker = workers[i - 3]! // pending_worker_response
    } else if (i < 10) {
      worker = workers[i - 5]! // accepted / in progress
    } else {
      worker = workers[(i - 10) % 6]! // completed
    }
    const buildUpdates = (entries: [RequestStatus, number][]): JobUpdateDoc[] =>
      entries.map(([status, minutes]) => ({ status, timestamp: isoAgo(minutes) }))
    const loc = seedLocation(i * 7 + 2)
    return {
      id: `r${i}`,
      customerId: `c${i % NAMES_C.length}`,
      customerName: NAMES_C[i % NAMES_C.length],
      workerId: worker?.userId,
      workerName: worker?.name,
      category: CATEGORIES[i % CATEGORIES.length]!,
      title: `${CATEGORIES[i % CATEGORIES.length]} repair needed`,
      description: `Issue with ${CATEGORIES[i % CATEGORIES.length]?.toLowerCase()} at my residence. Please call ahead.`,
      photoUrls: [],
      status:
        i < 3
          ? 'searching'
          : i < 5
            ? 'pending_worker_response'
            : i === 6
              ? 'on_the_way'
              : i === 7
                ? 'arrived'
                : i === 8
                  ? 'in_progress'
                  : i < 10
                    ? 'accepted'
                    : 'completed',
      customerLocation: locationToGeoPoint(loc),
      customerAddress: formatLocation(loc),
      customerPincode: loc.pincode,
      customerArea: loc.name,
      rejectedBy: [],
      jobUpdates:
        i < 5
          ? []
          : i < 10
            ? buildUpdates([
                ['accepted', 100 + i * 15],
                ...(i >= 6 ? [['on_the_way', 85 + i * 15]] : []),
                ...(i >= 7 ? [['arrived', 70 + i * 15]] : []),
                ...(i >= 8 ? [['in_progress', 55 + i * 15]] : []),
              ] as [RequestStatus, number][])
            : buildUpdates([
                ['accepted', 110 + i * 12],
                ['in_progress', 80 + i * 12],
                ['completed', 40 + i * 10],
              ]),
      createdAt: createdAgo(i),
      acceptedAt: i >= 8 ? isoAgo(20 + i * 18) : undefined,
      completedAt: i >= 10 ? completedAgo(i) : undefined,
      bill:
        i >= 10
          ? {
              productsCost: [120, 250, 180, 90][(i - 10) % 4]!,
              laborWage: [300, 450, 600, 350][(i - 10) % 4]!,
              total: 0,
              createdAt: completedAgo(i),
            }
          : undefined,
      paymentStatus: i >= 12 ? 'paid' : undefined,
      paymentMethod: i >= 12 ? (i % 2 === 0 ? 'upi' : 'cash') : undefined,
      paidAt: i >= 12 ? completedAgo(i) : undefined,
      ratingGiven: i >= 12,
    }
  })

  requests
    .filter((r) => r.bill)
    .forEach((r) => {
      r.bill!.total = r.bill!.productsCost + r.bill!.laborWage
    })

  const ratings: RatingDoc[] = requests
    .filter((r) => r.status === 'completed' && r.workerId && r.paymentStatus === 'paid')
    .map((r, i) => ({
      id: `rt${i}`,
      requestId: r.id,
      workerId: r.workerId!,
      customerId: r.customerId,
      customerName: r.customerName,
      rating: 3 + Math.floor(Math.random() * 3),
      comment: randItem(REVIEWS),
      createdAt: r.completedAt ?? isoAgo(5 + i * 5),
    }))

  const disputes: DisputeDoc[] = [
    {
      id: 'd0',
      requestId: 'r12',
      raisedBy: 'customer',
      reason: 'Late arrival',
      description: 'Worker was over 30 minutes late without communication.',
      status: 'open',
      createdAt: isoAgo(120),
    },
    {
      id: 'd1',
      requestId: 'r9',
      raisedBy: 'worker',
      reason: 'Non-payment',
      description: 'Customer refused to pay after job was completed.',
      status: 'resolved',
      resolutionNote: 'Payment confirmed via phone. Issue closed.',
      createdAt: isoAgo(300),
      resolvedAt: isoAgo(60),
    },
  ]

  const audit: AuditLogDoc[] = [
    { id: 'a0', actorId: 'admin1', actorRole: 'superadmin', action: 'approved_worker', targetId: 'w0', timestamp: isoAgo(2000) },
    { id: 'a1', actorId: 'admin1', actorRole: 'superadmin', action: 'resolved_dispute', targetId: 'd1', timestamp: isoAgo(70) },
    { id: 'a2', actorId: 'admin2', actorRole: 'support', action: 'rejected_verification', targetId: 'w9', timestamp: isoAgo(500) },
    { id: 'a3', actorId: 'admin1', actorRole: 'superadmin', action: 'suspended_user', targetId: 'c3', timestamp: isoAgo(800) },
  ]

  const verificationQueue: VerificationQueueDoc[] = [
    { workerId: 'w8', workerName: 'Luca Bertoni', govIdUrl: '', submittedAt: isoAgo(40), status: 'pending' },
    { workerId: 'w9', workerName: 'Tariq Osman', govIdUrl: '', submittedAt: isoAgo(90), status: 'pending' },
  ]

  return { workers, requests, ratings, disputes, audit, verificationQueue }
}

/* ── Public API ──────────────────────────────────────────────── */
export function getDemoStore() {
  return loadDemoStore()
}
export function resetDemoStore() {
  localStorage.removeItem(LS_KEY)
}
export function persistDemoStore(store: DemoStore) {
  saveDemoStore(store)
}

/* Demo auth helpers */
const DEMO_USER_KEY = 'geofix-demo-auth'

export interface DemoAccount {
  uid: string
  name: string
  email: string
  password: string
  role: 'customer' | 'worker' | 'admin'
  adminRole?: 'superadmin' | 'support'
  note: string
}

/**
 * Credential-carrying demo accounts shown on the login page.
 * Each maps to a seeded profile so the portal is never empty.
 */
export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    uid: 'c0',
    name: 'Aisha Patel',
    email: 'customer@demo.geofix',
    password: 'demo1234',
    role: 'customer',
    note: '1 active request + request history',
  },
  {
    uid: 'w0',
    name: 'Rajan Kumar',
    email: 'worker@demo.geofix',
    password: 'demo1234',
    role: 'worker',
    note: 'Verified · online · incoming job waiting',
  },
  {
    uid: 'w8',
    name: 'Luca Bertoni',
    email: 'worker2@demo.geofix',
    password: 'demo1234',
    role: 'worker',
    note: 'Awaiting ID verification',
  },
  {
    uid: 'admin1',
    name: 'Admin User',
    email: 'admin@geofix.app',
    password: 'admin1234',
    role: 'admin',
    adminRole: 'superadmin',
    note: 'Full operations access',
  },
]

export interface DemoAuthUser {
  uid: string
  name: string
  email?: string
  phone?: string
  role: 'customer' | 'worker' | 'admin'
  adminRole?: 'superadmin' | 'support'
  pincode?: string
  area?: string
}

export function getDemoAuthUser(): DemoAuthUser | null {
  const raw = localStorage.getItem(DEMO_USER_KEY)
  return raw ? (JSON.parse(raw) as DemoAuthUser) : null
}

export function setDemoAuthUser(user: DemoAuthUser | null) {
  if (user) localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user))
  else localStorage.removeItem(DEMO_USER_KEY)
}

/** Sign in a canned demo account and persist the session. */
export function signInDemoAccount(acc: DemoAccount): DemoAuthUser {
  const user: DemoAuthUser = {
    uid: acc.uid,
    name: acc.name,
    email: acc.email,
    role: acc.role,
    adminRole: acc.adminRole,
  }
  setDemoAuthUser(user)
  return user
}

export function demoSignUp(
  name: string,
  email: string,
  role: 'customer' | 'worker',
  categorySkills?: string[],
): DemoAuthUser {
  const id = `demo_${role[0]}${Date.now()}`
  const user: DemoAuthUser = { uid: id, name, email: email || `${id}@demo.geofix`, role }
  setDemoAuthUser(user)
  const store = getDemoStore()
  if (role === 'worker') {
    // Actually put the fresh worker on the platform so they can be requested.
    store.workers.push({
      userId: id,
      name,
      phone: email.replace(/[^\d]/g, '') || `+91${9000000000 + store.workers.length}`,
      categorySkills: categorySkills && categorySkills.length > 0 ? categorySkills : [CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]!],
      rating: 0,
      ratingCount: 0,
      jobsCompleted: 0,
      isOnline: true,
      bio: 'Newly registered professional.',
      verificationStatus: 'pending',
      availableSlots: [],
      g: {
        geohash: encodeGeohash(MADURAI_LOCATIONS[0]!.lat, MADURAI_LOCATIONS[0]!.lng),
        geopoint: locationToGeoPoint(MADURAI_LOCATIONS[0]!),
      },
    })
  }
  persistDemoStore(store)
  return user
}

export function demoAdminLogin(): DemoAuthUser {
  const user: DemoAuthUser = {
    uid: 'admin1',
    name: 'Admin User',
    email: 'admin@geofix.app',
    role: 'admin',
    adminRole: 'superadmin',
  }
  setDemoAuthUser(user)
  return user
}

export function demoWorkerLogin(idx = 0): DemoAuthUser {
  const user: DemoAuthUser = {
    uid: `w${idx}`,
    name: NAMES_W[idx]!,
    phone: `+91${9000000000 + idx}`,
    role: 'worker',
  }
  setDemoAuthUser(user)
  return user
}

export function demoCustomerLogin(idx = 0): DemoAuthUser {
  const user: DemoAuthUser = {
    uid: `c${idx}`,
    name: NAMES_C[idx]!,
    email: `c${idx}@example.com`,
    role: 'customer',
  }
  setDemoAuthUser(user)
  return user
}