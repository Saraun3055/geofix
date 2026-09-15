import type { Request } from 'express'

/** Shape of a verified access-token payload. */
export interface JwtPayloadShape {
  sub: string
  role: 'customer' | 'worker' | 'admin'
}

/** Request with auth middleware attached. */
export interface AuthRequest extends Request {
  user?: {
    id: string
    role: 'customer' | 'worker' | 'admin'
    /** Set when a request originates from the admin console acting on a user (audit trail). */
    interactingUserId?: string
  }
}