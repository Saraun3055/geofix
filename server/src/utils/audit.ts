import { AuditLog } from '../models/AuditLog'

export interface AuditPayload {
  actorId: string
  actorRole: string
  action: string
  targetId?: string
  meta?: Record<string, unknown>
}

export async function logAudit(payload: AuditPayload): Promise<void> {
  try {
    await AuditLog.create({
      actorId: payload.actorId,
      actorRole: payload.actorRole,
      action: payload.action,
      targetId: payload.targetId ?? '',
      meta: payload.meta ?? {},
    })
  } catch (e) {
    console.error('[audit] failed to write log', e)
  }
}