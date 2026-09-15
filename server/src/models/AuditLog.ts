import { Schema, model, type InferSchemaType } from 'mongoose'

export const auditLogSchema = new Schema({
  actorId: { type: String, required: true },
  actorRole: { type: String, required: true },
  action: { type: String, required: true },
  targetId: { type: String, default: '' },
  meta: { type: Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now },
})

auditLogSchema.index({ timestamp: -1 })

export const AuditLog = model('AuditLog', auditLogSchema)
export type AuditLogModel = InferSchemaType<typeof auditLogSchema>

export interface AuditLogDoc {
  id: string
  actorId: string
  actorRole: string
  action: string
  targetId: string
  timestamp: string
}

export function toAuditLogDoc(a: AuditLogModel & { _id: unknown }): AuditLogDoc {
  return {
    id: (a._id as { toString(): string }).toString(),
    actorId: a.actorId,
    actorRole: a.actorRole,
    action: a.action,
    targetId: a.targetId ?? '',
    timestamp: new Date(a.timestamp).toISOString(),
  }
}