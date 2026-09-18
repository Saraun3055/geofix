import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import type { Request, Response, NextFunction } from 'express'
import { connectDb } from './config/db'
import { requireAuth } from './middleware/auth'
import { sanitize } from './middleware/sanitize'
import { writeLimiter } from './middleware/rate-limit'
import authRoutes from './routes/auth.routes'
import usersRoutes from './routes/users.routes'
import workersRoutes from './routes/workers.routes'
import requestsRoutes from './routes/requests.routes'
import ratingsRoutes from './routes/ratings.routes'
import adminRoutes from './routes/admin.routes'

const app = express()
const PORT = Number(process.env.PORT ?? 4000)
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173'

app.use(helmet())
app.use(cors({ origin: CORS_ORIGIN, credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())

// NoSQL-injection defense (applied to every request body, query and params)
app.use(sanitize)

// Rate limiting for write/mutation routes
app.use(writeLimiter)

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'geofix-api', mode: 'local-api' })
})

// Public
app.use('/auth', authRoutes)

// Authenticated
app.use('/users', requireAuth, usersRoutes)
app.use('/workers', requireAuth, workersRoutes)
app.use('/requests', requireAuth, requestsRoutes)
app.use('/ratings', requireAuth, ratingsRoutes)
app.use('/admin', requireAuth, adminRoutes)

// 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` })
})

// Global error handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const e = err as { status?: number; message?: string }
  console.error('[api] unhandled error', e)
  res.status(e.status ?? 500).json({ message: e.message ?? 'Internal server error' })
})

async function main() {
  await connectDb()
  app.listen(PORT, () => {
    console.log(`[api] GeoFix local API listening on http://localhost:${PORT}`)
  })
}

main().catch((e) => {
  console.error('[api] failed to start', e)
  process.exit(1)
})