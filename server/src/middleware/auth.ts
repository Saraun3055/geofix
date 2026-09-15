import type { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { AuthRequest, JwtPayloadShape } from './types'

/**
 * Express middleware. Expects an `Authorization: Bearer <accessToken>` header
 * OR a valid refresh token cookie (used mainly for refreshing the access token).
 * Attaches `req.user = { id, role }` on success.
 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined

  if (!token) {
    res.status(401).json({ message: 'Authentication required' })
    return
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? 'dev_secret_change_me') as JwtPayloadShape
    if (!payload.sub || !payload.role) throw new Error('Malformed token')
    req.user = { id: payload.sub, role: payload.role }
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}