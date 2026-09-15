import { Schema, model, type InferSchemaType } from 'mongoose'
import type { LatLng } from '../utils/geo'

export const serviceRequestSchema = new Schema({
  customerId: { type: String, required: true },
  customerName: { type: String, default: '' },
  workerId: { type: String, default: null },
  workerName: { type: String, default: null },
  category: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  photoUrls: { type: [String], default: [] },
  status: {
    type: String,
    enum: ['searching', 'pending_worker_response', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'searching',
  },
  customerLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
  },
  customerAddress: { type: String, default: null },
  rejectedBy: { type: [String], default: [] },
  ratingGiven: { type: Boolean, default: false },
  bill: {
    type: {
      productsCost: { type: Number, required: true },
      laborWage: { type: Number, required: true },
      total: { type: Number, required: true },
      note: { type: String },
      createdAt: { type: Date, default: Date.now },
    },
    default: null,
  },
  paymentMethod: { type: String, enum: ['cash', 'upi'], default: null },
  paymentStatus: { type: String, enum: ['pending', 'paid'], default: null },
  paidAt: { type: Date, default: null },
  whatsappNumber: { type: String, default: null },
  chatChannelId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  acceptedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  updatedAt: { type: Date, default: Date.now },
})

serviceRequestSchema.index({ customerLocation: '2dsphere' })

export const ServiceRequest = model('ServiceRequest', serviceRequestSchema)
export type ServiceRequestModel = InferSchemaType<typeof serviceRequestSchema>

export interface RequestDoc {
  id: string
  customerId: string
  customerName?: string
  workerId?: string
  workerName?: string
  category: string
  title: string
  description: string
  photoUrls: string[]
  status: 'searching' | 'pending_worker_response' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
  customerLocation: LatLng
  customerAddress?: string
  rejectedBy: string[]
  ratingGiven?: boolean
  bill?: { productsCost: number; laborWage: number; total: number; note?: string; createdAt?: string }
  paymentMethod?: 'cash' | 'upi'
  paymentStatus?: 'pending' | 'paid'
  paidAt?: string
  whatsappNumber?: string
  chatChannelId?: string
  createdAt: string
  acceptedAt?: string
  completedAt?: string
  updatedAt?: string
}

export function toRequestDoc(r: ServiceRequestModel & { _id: unknown }): RequestDoc {
  const [lng, lat] = r.customerLocation!.coordinates as [number, number]
  const iso = (d: unknown) => (d ? new Date(d as string | number | Date).toISOString() : undefined)
  return {
    id: (r._id as { toString(): string }).toString(),
    customerId: r.customerId,
    customerName: r.customerName ?? undefined,
    workerId: r.workerId ?? undefined,
    workerName: r.workerName ?? undefined,
    category: r.category,
    title: r.title,
    description: r.description,
    photoUrls: r.photoUrls ?? [],
    status: r.status as RequestDoc['status'],
    customerLocation: { latitude: lat, longitude: lng },
    customerAddress: r.customerAddress ?? undefined,
    rejectedBy: r.rejectedBy ?? [],
    ratingGiven: r.ratingGiven ?? false,
    bill: r.bill
      ? {
          productsCost: r.bill.productsCost,
          laborWage: r.bill.laborWage,
          total: r.bill.total,
          note: r.bill.note ?? undefined,
          createdAt: iso(r.bill.createdAt),
        }
      : undefined,
    paymentMethod: (r.paymentMethod as RequestDoc['paymentMethod']) ?? undefined,
    paymentStatus: (r.paymentStatus as RequestDoc['paymentStatus']) ?? undefined,
    paidAt: iso(r.paidAt),
    whatsappNumber: r.whatsappNumber ?? undefined,
    chatChannelId: r.chatChannelId ?? undefined,
    createdAt: iso(r.createdAt) ?? new Date().toISOString(),
    acceptedAt: iso(r.acceptedAt),
    completedAt: iso(r.completedAt),
    updatedAt: iso(r.updatedAt),
  }
}