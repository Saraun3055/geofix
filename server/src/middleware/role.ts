import type { Request, Response, NextFunction } from 'express'
import type { AuthRequest } from './types'

/** Route guard factory. `requireRole('admin')` rejects non-admin callers. */
export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest
    const user = authReq.user
    if (!user || user.role !== role) {
      res.status(403).json({ message: 'You do not have permission to perform this action' })
      return
    }
    next()
  }
}