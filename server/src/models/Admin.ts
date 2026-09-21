import { Schema, model, type InferSchemaType } from 'mongoose'

/**
 * Privileged platform accounts live in their own `admins` collection —
 * completely separate from customers/workers. They are provisioned by the
 * seed script (no self sign-up) and are never exposed via /admin/users.
 */
export const adminSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, default: '' },
    adminRole: { type: String, enum: ['superadmin', 'support'], default: 'support' },
    photoUrl: { type: String, default: '' },
    suspended: { type: Boolean, default: false },
    resetTokenHash: { type: String, default: null },
    resetTokenExpiresAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
  },
)

export const Admin = model('Admin', adminSchema)
export type AdminDoc = InferSchemaType<typeof adminSchema>

export interface SafeAdmin {
  id: string
  name: string
  email: string
  phone?: string
  role: 'admin'
  adminRole: 'superadmin' | 'support'
  photoUrl?: string
  createdAt: string
}

export function toSafeAdmin(a: AdminDoc & { _id: unknown }): SafeAdmin {
  return {
    id: (a._id as { toString(): string }).toString(),
    name: a.name,
    email: a.email,
    phone: a.phone ?? '',
    role: 'admin',
    adminRole: (a.adminRole ?? 'support') as 'superadmin' | 'support',
    photoUrl: a.photoUrl ?? '',
    createdAt: new Date(a.createdAt).toISOString(),
  }
}