import jwt from 'jsonwebtoken'
import type { CookieOptions } from 'express'
import type { JwtPayloadShape } from '../middleware/types'

const ACCESS_TTL = (process.env.JWT_ACCESS_TTL ?? '1h') as jwt.SignOptions['expiresIn']
const REFRESH_TTL = (process.env.JWT_REFRESH_TTL ?? '30d') as jwt.SignOptions['expiresIn']

export function signAccessToken(userId: string, role: JwtPayloadShape['role']): string {
  return jwt.sign({ sub: userId, role }, process.env.JWT_SECRET ?? 'dev_secret_change_me', {
    expiresIn: ACCESS_TTL,
  })
}

export function signRefreshToken(userId: string, role: JwtPayloadShape['role']): string {
  return jwt.sign({ sub: userId, role }, process.env.JWT_REFRESH_SECRET ?? 'dev_refresh_secret_change_me', {
    expiresIn: REFRESH_TTL,
  })
}

export function verifyRefreshToken(token: string): JwtPayloadShape {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET ?? 'dev_refresh_secret_change_me') as JwtPayloadShape
}

/** HttpOnly refresh-token cookie. SameSite=Lax keeps it working on same-site
 *  cross-port dev (localhost:5173 <-> localhost:4000) without a proxy. */
export function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/auth/refresh',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  }
}