import type { Request } from 'express'
import rateLimit from 'express-rate-limit'

/**
 * General API rate limiter for write routes (skips read-only methods so browsing
 * and the polling hooks that keep pages live are unaffected).
 */
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === 'production' ? 300 : 5000, // relaxed for local dev
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => ['GET', 'HEAD', 'OPTIONS'].includes(req.method),
  message: { message: 'Too many requests — please try again in a moment' },
})