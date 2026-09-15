import { Schema, model, type InferSchemaType } from 'mongoose'

/**
 * Worker profile backing data. The DB stores a native GeoJSON `location`
 * ([lng, lat]) so MongoDB `$geoNear`/`$near` works; the API serializes it back
 * into the frontend `WorkerProfileDoc` shape (`g.geopoint` + `verificationStatus`).
 */
export const workerProfileSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, default: '' },
    categorySkills: { type: [String], default: [] },
    availableSlots: {
      type: [
        {
          day: { type: String, required: true },
          from: { type: String, required: true },
          to: { type: String, required: true },
        },
      ],
      default: [],
    },
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    jobsCompleted: { type: Number, default: 0 },
    isOnline: { type: Boolean, default: false },
    address: { type: String, default: '' },
    bio: { type: String, default: '' },
    avgResponseMin: { type: Number, default: 0 },
    govIdUrl: { type: String, default: '' },
    verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    currentRequestId: { type: String, default: null },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    createdAt: { type: Date, default: Date.now },
  },
  { toJSON: { virtuals: false } },
)

workerProfileSchema.index({ location: '2dsphere' })

export const WorkerProfile = model('WorkerProfile', workerProfileSchema)
export type WorkerProfileModel = InferSchemaType<typeof workerProfileSchema>

/**
 * Frontend-shaped worker doc. The layout matches `WorkerProfileDoc` in
 * `src/lib/types.ts` (uid, categorySkills, g.geopoint GeoPoint, etc.).
 */
export interface AvailabilitySlot {
  day: string
  from: string
  to: string
}

export interface WorkerDoc {
  uid: string
  userId: string
  name: string
  phone: string
  categorySkills: string[]
  availableSlots: AvailabilitySlot[]
  rating: number
  ratingCount: number
  jobsCompleted: number
  isOnline: boolean
  address: string
  bio: string
  avgResponseMin: number
  govIdUrl: string
  verificationStatus: 'pending' | 'approved' | 'rejected'
  currentRequestId: string | null
  g: { geohash: string; geopoint: { latitude: number; longitude: number } }
  createdAt: string
  /** Distance from query point in meters (nearby queries only). */
  _distance?: number
}

export function toWorkerDoc(w: WorkerProfileModel & { _id: unknown }, distanceMeters?: number): WorkerDoc {
  const [lng, lat] = w.location!.coordinates as [number, number]
  return {
    uid: (w._id as { toString(): string }).toString(),
    userId: w.userId,
    name: w.name,
    phone: w.phone ?? '',
    categorySkills: w.categorySkills ?? [],
    availableSlots: (w.availableSlots ?? []).map((s) => ({ day: s.day, from: s.from, to: s.to })),
    rating: w.rating ?? 0,
    ratingCount: w.ratingCount ?? 0,
    jobsCompleted: w.jobsCompleted ?? 0,
    isOnline: w.isOnline ?? false,
    address: w.address ?? '',
    bio: w.bio ?? '',
    avgResponseMin: w.avgResponseMin ?? 0,
    govIdUrl: w.govIdUrl ?? '',
    verificationStatus: w.verificationStatus as WorkerDoc['verificationStatus'],
    currentRequestId: w.currentRequestId ?? null,
    g: { geohash: '', geopoint: { latitude: lat, longitude: lng } },
    createdAt: new Date(w.createdAt).toISOString(),
    _distance: distanceMeters,
  }
}