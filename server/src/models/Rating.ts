import { Schema, model, type InferSchemaType } from 'mongoose'

export const ratingSchema = new Schema({
  requestId: { type: String, required: true },
  workerId: { type: String, required: true },
  customerId: { type: String, required: true },
  customerName: { type: String, default: '' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
})

ratingSchema.index({ workerId: 1, createdAt: -1 })

export const Rating = model('Rating', ratingSchema)
export type RatingModel = InferSchemaType<typeof ratingSchema>

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

export function toRatingDoc(r: RatingModel & { _id: unknown }): RatingDoc {
  return {
    id: (r._id as { toString(): string }).toString(),
    requestId: r.requestId,
    workerId: r.workerId,
    customerId: r.customerId,
    customerName: r.customerName ?? undefined,
    rating: r.rating,
    comment: r.comment ?? undefined,
    createdAt: new Date(r.createdAt).toISOString(),
  }
}