import type { Response, NextFunction } from 'express'
import type { AuthRequest, JwtPayloadShape } from './types'
import { verifyAccessToken } from '../utils/token'

/**
 * Express middleware. Expects an `Authorization: Bearer <accessToken>` header.
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
    const payload: JwtPayloadShape = verifyAccessToken(token)
    req.user = { id: payload.sub, role: payload.role }
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}