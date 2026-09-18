import type { Request, Response, NextFunction } from 'express'
import type { AuthRequest } from './types'

/** Route guard factory. `requireRole('admin')` rejects non-admin callers.
 *  Variadic: `requireRole('customer', 'worker')` allows either role. */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest
    const user = authReq.user
    if (!user || !allowedRoles.includes(user.role)) {
      res.status(403).json({ message: 'You do not have permission to perform this action' })
      return
    }
    next()
  }
}

/** Is the authenticated user one of the given roles? Used for inline guards. */
export function hasRole(role: string | undefined, allowedRoles: string[]): boolean {
  return !!role && allowedRoles.includes(role)
}