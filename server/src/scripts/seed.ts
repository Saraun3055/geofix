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
const BASE = { lat: 28.6139, lng: 77.209 }
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
  const adminUser = await upsertAdmin('ops@geofix.app', 'admin1234', 'Ops Admin', 'superadmin')
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

  for (const p of seedWorkerProfiles) {
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
        address: '1 Home Street, Local City',
        bio: 'Reliable professional with local experience.',
        avgResponseMin: 5 + Math.floor(Math.random() * 20),
        verificationStatus: 'approved',
        availableSlots: p.isOnline
          ? []
          : [
              { day: ['Mon', 'Wed', 'Fri'][p.userId.charCodeAt(1) % 3]!, from: '09:00', to: '13:00' },
              { day: ['Tue', 'Thu', 'Sat'][p.userId.charCodeAt(1) % 3]!, from: '16:00', to: '20:00' },
            ],
        location: { type: 'Point', coordinates: [BASE.lng + (Math.random() - 0.5) * 0.16, BASE.lat + (Math.random() - 0.5) * 0.16] },
      },
      { upsert: true },
    )
  }
  // Demo worker account profile (General skills, online).
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
      address: '55 Demo Street, Local City',
      bio: 'Demo worker account for local testing.',
      avgResponseMin: 8,
verificationStatus: 'approved',
    availableSlots: [
      { day: 'Tue', from: '09:00', to: '13:00' },
      { day: 'Thu', from: '16:00', to: '20:00' },
    ],
    location: { type: 'Point', coordinates: [BASE.lng + 0.02, BASE.lat + 0.01] },
    },
    { upsert: true },
  )

  // Requests (replaceable bundle so re-seeding stays consistent).
  const requests = await ServiceRequest.create([
    {
      customerId: customerUser._id.toString(),
      customerName: customerUser.name,
      category: 'Plumbing',
      title: 'Kitchen sink leaking',
      description: 'Water pooling under the sink, looks like a broken pipe joint.',
      photoUrls: [],
      status: 'searching',
      customerLocation: { type: 'Point', coordinates: [BASE.lng + 0.005, BASE.lat + 0.004] },
      customerAddress: '12 Maple Grove, Old Town',
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
      customerLocation: { type: 'Point', coordinates: [BASE.lng - 0.01, BASE.lat + 0.01] },
      customerAddress: '44 Riverbend Rd, Greenfield',
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
      customerLocation: { type: 'Point', coordinates: [BASE.lng + 0.02, BASE.lat - 0.01] },
      customerAddress: '81 King St, Harborview',
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
      customerLocation: { type: 'Point', coordinates: [BASE.lng + 0.015, BASE.lat + 0.008] },
      customerAddress: '7 Oak Lane, Meadowlands',
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
      customerLocation: { type: 'Point', coordinates: [BASE.lng - 0.02, BASE.lat + 0.012] },
      customerAddress: '29 Hillcrest Ave, Rosewood',
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