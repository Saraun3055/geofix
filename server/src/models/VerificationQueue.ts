import { Schema, model, type InferSchemaType } from 'mongoose'

export const verificationQueueSchema = new Schema({
  workerId: { type: String, required: true, unique: true },
  workerName: { type: String, default: '' },
  govIdUrl: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy: { type: String, default: '' },
  reviewedAt: { type: Date, default: null },
  submittedAt: { type: Date, default: Date.now },
})

export const VerificationQueue = model('VerificationQueue', verificationQueueSchema)
export type VerificationQueueModel = InferSchemaType<typeof verificationQueueSchema>

export interface VerificationQueueDoc {
  workerId: string
  workerName?: string
  govIdUrl: string
  submittedAt: string
  status: 'pending' | 'approved' | 'rejected'
  reviewedBy?: string
  reviewedAt?: string
}

export function toVerificationQueueDoc(v: VerificationQueueModel): VerificationQueueDoc {
  return {
    workerId: v.workerId,
    workerName: v.workerName ?? '',
    govIdUrl: v.govIdUrl ?? '',
    submittedAt: new Date(v.submittedAt).toISOString(),
    status: v.status as VerificationQueueDoc['status'],
    reviewedBy: v.reviewedBy ?? undefined,
    reviewedAt: v.reviewedAt ? new Date(v.reviewedAt).toISOString() : undefined,
  }
}