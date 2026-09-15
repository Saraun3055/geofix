import { Schema, model, type InferSchemaType } from 'mongoose'

export const disputeSchema = new Schema({
  requestId: { type: String, required: true },
  raisedBy: { type: String, enum: ['customer', 'worker'], required: true },
  reason: { type: String, required: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['open', 'resolved'], default: 'open' },
  resolutionNote: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date, default: null },
})

export const Dispute = model('Dispute', disputeSchema)
export type DisputeModel = InferSchemaType<typeof disputeSchema>

export interface DisputeDoc {
  id: string
  requestId: string
  raisedBy: 'customer' | 'worker'
  reason: string
  description: string
  status: 'open' | 'resolved'
  resolutionNote?: string
  createdAt: string
  resolvedAt?: string
}

export function toDisputeDoc(d: DisputeModel & { _id: unknown }): DisputeDoc {
  return {
    id: (d._id as { toString(): string }).toString(),
    requestId: d.requestId,
    raisedBy: d.raisedBy as DisputeDoc['raisedBy'],
    reason: d.reason,
    description: d.description ?? '',
    status: d.status as DisputeDoc['status'],
    resolutionNote: d.resolutionNote ?? undefined,
    createdAt: new Date(d.createdAt).toISOString(),
    resolvedAt: d.resolvedAt ? new Date(d.resolvedAt).toISOString() : undefined,
  }
}