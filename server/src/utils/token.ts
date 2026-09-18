import jwt from 'jsonwebtoken'
import type { CookieOptions } from 'express'
import type { JwtPayloadShape } from '../middleware/types'

const ACCESS_TTL = (process.env.JWT_ACCESS_TTL ?? '1h') as jwt.SignOptions['expiresIn']
const REFRESH_TTL = (process.env.JWT_REFRESH_TTL ?? '30d') as jwt.SignOptions['expiresIn']
const DEV_ACCESS_SECRET = 'dev_secret_change_me'
const DEV_REFRESH_SECRET = 'dev_refresh_secret_change_me'

/**
 * Production-safe secret resolution. Refuses to run with placeholder secrets in
 * production so a misconfigured deploy fails loudly instead of signing tokens
 * with a public default.
 */
function accessSecret(): string {
  const secret = process.env.JWT_SECRET
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret === DEV_ACCESS_SECRET) {
      throw new Error('JWT_SECRET must be set to a strong value in production')
    }
  }
  return secret ?? DEV_ACCESS_SECRET
}

function refreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret === DEV_REFRESH_SECRET) {
      throw new Error('JWT_REFRESH_SECRET must be set to a strong value in production')
    }
  }
  return secret ?? DEV_REFRESH_SECRET
}

export function signAccessToken(userId: string, role: JwtPayloadShape['role']): string {
  return jwt.sign({ sub: userId, role }, accessSecret(), {
    expiresIn: ACCESS_TTL,
    issuer: 'geofix-api',
    audience: 'geofix-web',
  })
}

export function signRefreshToken(userId: string, role: JwtPayloadShape['role']): string {
  return jwt.sign({ sub: userId, role }, refreshSecret(), {
    expiresIn: REFRESH_TTL,
    issuer: 'geofix-api',
    audience: 'geofix-web',
  })
}

export function verifyAccessToken(token: string): JwtPayloadShape {
  const payload = jwt.verify(token, accessSecret(), {
    issuer: 'geofix-api',
    audience: 'geofix-web',
  }) as jwt.JwtPayload & Partial<JwtPayloadShape>
  if (!payload.sub || !payload.role) throw new Error('Malformed token')
  return { sub: payload.sub, role: payload.role }
}

export function verifyRefreshToken(token: string): JwtPayloadShape {
  const payload = jwt.verify(token, refreshSecret(), {
    issuer: 'geofix-api',
    audience: 'geofix-web',
  }) as jwt.JwtPayload & Partial<JwtPayloadShape>
  if (!payload.sub || !payload.role) throw new Error('Malformed token')
  return { sub: payload.sub, role: payload.role }
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