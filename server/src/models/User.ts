import { Schema, model, type InferSchemaType } from 'mongoose'

export const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, default: '' },
    role: { type: String, enum: ['customer', 'worker', 'admin'], default: 'customer' },
    photoUrl: { type: String, default: '' },
    suspended: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
)

export const User = model('User', userSchema)
export type UserDoc = InferSchemaType<typeof userSchema>

/** JWT access-token payload — mirrors the frontend `UserDoc` id/role. */
export interface SafeUser {
  id: string
  name: string
  email: string
  phone: string
  role: 'customer' | 'worker' | 'admin'
  photoUrl?: string
  adminRole?: string
  createdAt: string
}

export function toSafeUser(u: UserDoc & { _id: unknown }): SafeUser {
  return {
    id: (u._id as { toString(): string }).toString(),
    name: u.name,
    email: u.email,
    phone: u.phone ?? '',
    role: u.role as 'customer' | 'worker' | 'admin',
    photoUrl: u.photoUrl ?? '',
    createdAt: new Date(u.createdAt).toISOString(),
  }
}