import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { User } from '../models/User'
import { Admin } from '../models/Admin'
import { WorkerProfile } from '../models/WorkerProfile'
import { ServiceRequest } from '../models/ServiceRequest'
import { Rating } from '../models/Rating'
import { VerificationQueue } from '../models/VerificationQueue'
import { Dispute } from '../models/Dispute'
import { AuditLog } from '../models/AuditLog'
import { connectDb, disconnectDb } from '../config/db'

/* Mirrors `src/lib/demo.ts` so demo and local-api show the same world. */
const CATEGORIES = ['Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Appliance', 'Locksmith', 'AC / HVAC', 'General']
const NAMES_W = ['Rajan Kumar', 'Yusuf Idris', 'Miguel Santos', 'Ravi Sharma', 'Jamal Benson', 'Anna Nowak', 'Diego Morales', 'Hassan Patel', 'Luca Bertoni', 'Tariq Osman']
const ONLINE_INDEXES = new Set([0, 1, 4, 5])

/** Madurai region dataset (mirrors `src/lib/madurai-locations.ts`). */
const MADURAI_META: Array<[name: string, pincode: string, lat: number, lng: number]> = [
  ['Simmakkal', '625001', 9.922, 78.119],
  ['Tallakulam', '625002', 9.934, 78.131],
  ['Madakkulam', '625002', 9.947, 78.132],
  ['Kudakoil', '625003', 9.952, 78.146],
  ['Koodal Nagar', '625003', 9.964, 78.15],
  ['Ponmeni', '625004', 9.942, 78.153],
  ['Arasaradi', '625004', 9.93, 78.146],
  ['Anna Nagar', '625020', 9.958, 78.117],
  ['K Pudur', '625007', 9.927, 78.109],
  ['Sivanandanagar', '625007', 9.916, 78.104],
  ['Kappalur', '625008', 9.904, 78.09],
  ['Krishnapuram', '625009', 9.938, 78.1],
  ['Vilakkuthoon', '625001', 9.927, 78.123],
  ['Goripalayam', '625002', 9.929, 78.127],
  ['Melur', '625106', 10.032, 78.339],
  ['Kottampatti', '625103', 10.077, 78.218],
  ['Thiruparankundram', '625005', 9.883, 78.071],
  ['Pasumalai', '625005', 9.91, 78.083],
  ['Tirunagar', '625015', 9.895, 78.116],
  ['Avaniapuram', '625012', 9.861, 78.113],
  ['Anuppanady', '625012', 9.872, 78.093],
  ['Jaihindpuram', '625011', 9.9, 78.145],
  ['Kalimangalam', '625016', 9.937, 78.03],
  ['Anaiyur', '625017', 9.897, 78.076],
  ['Podumbu', '625022', 9.878, 78.143],
  ['Karuvanur', '625018', 9.90, 78.177],
  ['Kathiathur', '625019', 9.912, 78.209],
  ['Vellaigundam', '625021', 9.934, 78.071],
  ['Madras High Court Madurai Bench', '625023', 9.922, 78.118],
  ['Samayanallur', '625402', 9.992, 78.005],
  ['Paravai', '625402', 9.906, 78.085],
  ['Alagarkoil', '625301', 10.091, 78.213],
  ['Alanganallur', '625501', 10.035, 78.101],
  ['Palamedu', '625503', 10.067, 78.148],
  ['Checkanurani', '625514', 10.112, 78.006],
  ['Usilampatti', '625532', 9.967, 77.801],
  ['Vadipatti', '625218', 10.084, 77.965],
  ['Sholavandan', '625214', 9.979, 77.873],
  ['Silaiman', '625201', 9.966, 78.006],
  ['Chellampatti', '625514', 10.062, 78.022],
  ['Tiruvedagam', '625234', 10.012, 77.903],
  ['Tirumangalam', '625706', 9.81, 77.983],
  ['T Kallupatti', '625702', 9.723, 77.976],
  ['Peraiyur', '625703', 9.722, 77.791],
  ['Kalligudi', '625701', 9.833, 77.952],
  ['Saptur', '625705', 9.776, 77.844],
  ['Villur', '625707', 9.808, 77.711],
]

function maduraiLocation(index: number) {
  return MADURAI_META[(index * 37 + 5) % MADURAI_META.length]!
}

function maduraiArea(loc: { readonly 0: string; readonly 1: string }): string {
  return `${loc[0]}, ${loc[1]} · Madurai, Tamil Nadu`
}

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

function isoAgo(min: number): Date {
  return new Date(Date.now() - min * 60_000)
}

async function upsertUser(email: string, password: string, name: string, role: 'customer' | 'worker') {
  const existing = await User.findOne({ email })
  if (existing) return existing
  return User.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    phone: '+91 9' + String(Math.floor(100000000 + Math.random() * 899999999)),
    role,
  })
}

/** Admins live in their own collection — never alongside customers/workers. */
async function upsertAdmin(email: string, password: string, name: string, adminRole: 'superadmin' | 'support' = 'support') {
  const existing = await Admin.findOne({ email })
  if (existing) return existing
  return Admin.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    adminRole,
  })
}

async function seed() {
  await connectDb()
  const reset = process.argv.includes('--reset')
  const force = process.argv.includes('--force')
  const demo = process.argv.includes('--demo')

  // The admin account is always provisioned (idempotent) so the platform is
  // never left without a superuser, demo or not.
  const adminUser = await upsertAdmin('ops@geofix.app', 'admin1234', 'Ops Admin', 'superadmin')

  if (!demo) {
    console.log('[seed] demo accounts are disabled. Run `npm run seed -- --demo` to reseed sample data.')
    console.log('[seed] done: admin ok (ops@geofix.app / admin1234)')
    await disconnectDb()
    return
  }

  // ── Real-user protection ────────────────────────────────────────────
  // Exactly one demo user was lost to a --reset re-seed, so the seed is now
  // deliberately destructive only when forced. Losing real data again means
  // a manual Mongo restore, which the free Atlas tier does not provide.
  const DEMO_EMAIL_RE = /@(geofix\.app|demo\.geofix)$/i
  const realUsers = await User.exists({ email: { $not: DEMO_EMAIL_RE } })
  if (realUsers && !force) {
    console.error(
      '[seed] BLOCKED: real (non-demo) users exist in the database.\n' +
        '  - Plain `npm run seed` deletes requests/ratings/audit-log (their history) every run.\n' +
        '  - Adding `--reset` would also delete every registered account.\n' +
        '  Nothing will be deleted. If you intentionally want to wipe real data, run with --force.',
    )
    await disconnectDb()
    return
  }

  // Users + worker profiles are upserted by email/userId so they stay stable
  // across runs. The child collections are rebuilt every run — otherwise a
  // re-seed hits UNIQUE-index collisions / duplicates.
  await Promise.all([
    ServiceRequest.deleteMany({}),
    Rating.deleteMany({}),
    VerificationQueue.deleteMany({}),
    Dispute.deleteMany({}),
    AuditLog.deleteMany({}),
  ])

  if (reset) {
    console.log('[seed] --reset: dropping user + worker collections')
    await Promise.all([
      User.deleteMany({}),
      WorkerProfile.deleteMany({}),
    ])
  }

  // Demo accounts the frontend login screen already suggests.
  // Admin accounts belong to their own collection; any legacy admin docs left
  // in the users collection are migrated out so users stay customer/worker only.
  await User.deleteMany({ $or: [{ role: 'admin' }, { email: 'ops@geofix.app' }] })
  const customerUser = await upsertUser('customer.demo@geofix.app', 'customer1234', 'Demo Customer', 'customer')

  // 10 deterministic workers + dedicated demo worker account.
  const workers: Array<{ user: Awaited<ReturnType<typeof upsertUser>> }> = []
  for (let i = 0; i < NAMES_W.length; i++) {
    const email = `worker.demo.${i + 1}@geofix.app`
    const user = await upsertUser(email, 'worker1234', NAMES_W[i]!, 'worker')
    workers.push({ user })
  }
  const demoWorkerUser = await upsertUser('worker.demo@geofix.app', 'worker1234', 'Demo Worker', 'worker')

  const seedWorkerProfiles: Array<{ userId: string; name: string; isOnline: boolean; categorySkills: string[] }> = []
  workers.forEach((w, i) => {
    const categorySkills = [CATEGORIES[i % 8]!, CATEGORIES[(i + 2) % 8]!]
    const userId = w.user._id.toString()
    seedWorkerProfiles.push({ userId, name: w.user.name, isOnline: ONLINE_INDEXES.has(i), categorySkills })
  })

for (const [i, p] of seedWorkerProfiles.entries()) {
    const loc = maduraiLocation(i * 3)
    await WorkerProfile.updateOne(
      { userId: p.userId },
      {
        userId: p.userId,
        name: p.name,
        phone: '+91 98' + String(70000000 + Math.floor(Math.random() * 29999999)),
        categorySkills: p.categorySkills,
        rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
        ratingCount: 3 + Math.floor(Math.random() * 15),
        jobsCompleted: 2 + Math.floor(Math.random() * 20),
        isOnline: p.isOnline,
        address: maduraiArea(loc),
        pincode: loc[1],
        area: loc[0],
        bio: 'Reliable professional with local experience.',
        avgResponseMin: 5 + Math.floor(Math.random() * 20),
        verificationStatus: 'approved',
        availableSlots: p.isOnline
          ? []
          : [
              { day: ['Mon', 'Wed', 'Fri'][p.userId.charCodeAt(1) % 3]!, from: '09:00', to: '13:00' },
              { day: ['Tue', 'Thu', 'Sat'][p.userId.charCodeAt(1) % 3]!, from: '16:00', to: '20:00' },
            ],
        location: { type: 'Point', coordinates: [loc[3], loc[2]] },
      },
      { upsert: true },
    )
  }
  // Demo worker account profile (General skills, online).
  const demoLoc = maduraiLocation(3)
  await WorkerProfile.updateOne(
    { userId: demoWorkerUser._id.toString() },
    {
      userId: demoWorkerUser._id.toString(),
      name: demoWorkerUser.name,
      phone: '+91 98765 00000',
      categorySkills: ['General'],
      rating: 4.6,
      ratingCount: 12,
      jobsCompleted: 9,
      isOnline: true,
      address: maduraiArea(demoLoc),
      pincode: demoLoc[1],
      area: demoLoc[0],
      bio: 'Demo worker account for local testing.',
      avgResponseMin: 8,
    verificationStatus: 'approved',
    availableSlots: [
      { day: 'Tue', from: '09:00', to: '13:00' },
      { day: 'Thu', from: '16:00', to: '20:00' },
    ],
    location: { type: 'Point', coordinates: [demoLoc[3], demoLoc[2]] },
    },
    { upsert: true },
  )

  // Requests (replaceable bundle so re-seeding stays consistent).
  const requestLocs = [0, 6, 11, 3, 8].map((n) => maduraiLocation(n * 7 + 2))
  const requests = await ServiceRequest.create([
    {
      customerId: customerUser._id.toString(),
      customerName: customerUser.name,
      category: 'Plumbing',
      title: 'Kitchen sink leaking',
      description: 'Water pooling under the sink, looks like a broken pipe joint.',
      photoUrls: [],
      status: 'searching',
      customerLocation: { type: 'Point', coordinates: [requestLocs[0]![3], requestLocs[0]![2]] },
      customerAddress: maduraiArea(requestLocs[0]!),
      customerPincode: requestLocs[0]![1],
      customerArea: requestLocs[0]![0],
      rejectedBy: [],
      createdAt: isoAgo(8),
      updatedAt: isoAgo(8),
    },
    {
      customerId: customerUser._id.toString(),
      customerName: customerUser.name,
      category: 'Electrical',
      title: 'Wonky ceiling fan',
      description: 'Ceiling fan makes noise and wobbles at high speed.',
      photoUrls: [],
      status: 'pending_worker_response',
      customerLocation: { type: 'Point', coordinates: [requestLocs[1]![3], requestLocs[1]![2]] },
      customerAddress: maduraiArea(requestLocs[1]!),
      customerPincode: requestLocs[1]![1],
      customerArea: requestLocs[1]![0],
      rejectedBy: [],
      workerId: seedWorkerProfiles[1]?.userId,
      workerName: seedWorkerProfiles[1]?.name,
      createdAt: isoAgo(25),
      updatedAt: isoAgo(6),
    },
    {
      customerId: customerUser._id.toString(),
      customerName: customerUser.name,
      category: 'AC / HVAC',
      title: 'AC not cooling',
      description: 'AC blows warm air after a few minutes.',
      photoUrls: [],
      status: 'accepted',
      customerLocation: { type: 'Point', coordinates: [requestLocs[2]![3], requestLocs[2]![2]] },
      customerAddress: maduraiArea(requestLocs[2]!),
      customerPincode: requestLocs[2]![1],
      customerArea: requestLocs[2]![0],
      rejectedBy: [],
      workerId: seedWorkerProfiles[4]?.userId,
      workerName: seedWorkerProfiles[4]?.name,
      createdAt: isoAgo(60),
      acceptedAt: isoAgo(20),
      jobUpdates: [{ status: 'accepted', timestamp: isoAgo(20) }],
      updatedAt: isoAgo(20),
    },
    {
      customerId: customerUser._id.toString(),
      customerName: customerUser.name,
      category: 'Locksmith',
      title: 'Locked out of flat',
      description: 'Door lock jammed, need urgent help.',
      photoUrls: [],
      status: 'completed',
      customerLocation: { type: 'Point', coordinates: [requestLocs[3]![3], requestLocs[3]![2]] },
      customerAddress: maduraiArea(requestLocs[3]!),
      customerPincode: requestLocs[3]![1],
      customerArea: requestLocs[3]![0],
      rejectedBy: [],
      workerId: seedWorkerProfiles[5]?.userId,
      workerName: seedWorkerProfiles[5]?.name,
      ratingGiven: true,
      createdAt: isoAgo(60 * 24 * 2),
      acceptedAt: isoAgo(60 * 24 * 2 - 30),
      jobUpdates: [
        { status: 'accepted', timestamp: isoAgo(60 * 24 * 2 - 30) },
        { status: 'in_progress', timestamp: isoAgo(60 * 24 * 2 - 20) },
        { status: 'completed', timestamp: isoAgo(60 * 24 * 2 - 15) },
      ],
      completedAt: isoAgo(60 * 24 * 2 - 15),
      updatedAt: isoAgo(60 * 24 * 2 - 15),
    },
    {
      customerId: customerUser._id.toString(),
      customerName: customerUser.name,
      category: 'Appliance',
      title: 'Washing machine drum noise',
      description: 'Loud rumbling during spin cycle.',
      photoUrls: [],
      status: 'completed',
      customerLocation: { type: 'Point', coordinates: [requestLocs[4]![3], requestLocs[4]![2]] },
      customerAddress: maduraiArea(requestLocs[4]!),
      customerPincode: requestLocs[4]![1],
      customerArea: requestLocs[4]![0],
      rejectedBy: [],
      workerId: seedWorkerProfiles[2]?.userId,
      workerName: seedWorkerProfiles[2]?.name,
      ratingGiven: true,
      createdAt: isoAgo(60 * 24 * 5),
      acceptedAt: isoAgo(60 * 24 * 5 - 45),
      jobUpdates: [
        { status: 'accepted', timestamp: isoAgo(60 * 24 * 5 - 45) },
        { status: 'in_progress', timestamp: isoAgo(60 * 24 * 5 - 35) },
        { status: 'completed', timestamp: isoAgo(60 * 24 * 5 - 25) },
      ],
      completedAt: isoAgo(60 * 24 * 5 - 25),
      updatedAt: isoAgo(60 * 24 * 5 - 25),
    },
  ])

  const completed = requests.filter((r) => r.status === 'completed')
  for (let i = 0; i < completed.length; i++) {
    const req = completed[i]!
    await Rating.create({
      requestId: req._id.toString(),
      workerId: req.workerId,
      customerId: customerUser._id.toString(),
      customerName: customerUser.name,
      rating: 4 + (i === 0 ? 1 : 0),
      comment: REVIEWS[i] ?? '',
      createdAt: isoAgo(60 * 24 * 2 - 10),
    })
  }

  const firstWorker = seedWorkerProfiles[3]!
  await VerificationQueue.insertMany([
    {
      workerId: firstWorker.userId,
      workerName: firstWorker.name,
      govIdUrl: 'data:image/png;base64,DUMMYVERIF-1',
      status: 'pending',
      submittedAt: isoAgo(3 * 60),
    },
    {
      workerId: seedWorkerProfiles[2]!.userId,
      workerName: seedWorkerProfiles[2]!.name,
      govIdUrl: 'data:image/png;base64,DUMMYVERIF-2',
      status: 'approved',
      reviewedBy: adminUser._id.toString(),
      reviewedAt: isoAgo(60 * 24 * 3),
      submittedAt: isoAgo(60 * 24 * 4),
    },
  ])

  await Dispute.insertMany([
    {
      requestId: requests[2]?._id.toString() ?? '',
      raisedBy: 'customer',
      reason: 'Arrived late repeatedly',
      description: 'Worker rescheduled three times and arrived 2 hours late.',
      status: 'open',
      createdAt: isoAgo(60 * 24 * 1),
    },
    {
      requestId: requests[3]?._id.toString() ?? '',
      raisedBy: 'worker',
      reason: 'Customer disputed payment',
      description: 'Customer claims the lock was already broken before I arrived.',
      status: 'resolved',
      resolutionNote: 'Reviewed photos — lock failure pre-existing. Payment released.',
      createdAt: isoAgo(60 * 24 * 6),
      resolvedAt: isoAgo(60 * 24 * 5),
    },
  ])

  await AuditLog.insertMany([
    { actorId: adminUser._id.toString(), actorRole: 'admin', action: 'login', targetId: adminUser._id.toString(), timestamp: isoAgo(5) },
    { actorId: adminUser._id.toString(), actorRole: 'admin', action: 'verification_approved', targetId: seedWorkerProfiles[2]!.userId, timestamp: isoAgo(60 * 24 * 3) },
    { actorId: customerUser._id.toString(), actorRole: 'customer', action: 'create_request', targetId: requests[0]!._id.toString(), timestamp: isoAgo(8) },
  ])

  console.log('[seed] done:')
  console.log(`  admin:     ops@geofix.app / admin1234`)
  console.log(`  customer:  customer.demo@geofix.app / customer1234`)
  console.log(`  worker:    worker.demo@geofix.app / worker1234`)
  console.log(`  workers:   worker.demo.1..10@geofix.app / worker1234`)
  await disconnectDb()
}

seed().catch((e) => {
  console.error('[seed] failed', e)
  process.exit(1)
})