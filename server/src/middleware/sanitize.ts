import type { Request, Response, NextFunction } from 'express'

/**
 * NoSQL-injection defense. Recursively strips MongoDB operator keys (`$` prefixed,
 * e.g. `$where`, `$gt`, `$ne`) and dotted keys (`a.b`) from `body`, `query` and
 * `params` so attacker input can never reach the query builder as operators.
 */
function scrub(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => scrub(item))
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      if (k.startsWith('$') || k.includes('.')) continue
      out[k] = scrub(v)
    }
    return out
  }
  return value
}

export function sanitize(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    const clean = scrub(req.body)
    for (const key of Object.keys(req.body as Record<string, unknown>)) {
      delete (req.body as Record<string, unknown>)[key]
    }
    Object.assign(req.body, clean)
  }

  if (req.query) {
    const clean = scrub(req.query) as Record<string, unknown>
    for (const key of Object.keys(req.query)) {
      delete (req.query as Record<string, unknown>)[key]
    }
    Object.assign(req.query, clean)
  }

  if (req.params) {
    const clean = scrub(req.params) as Record<string, unknown>
    for (const key of Object.keys(req.params)) {
      delete (req.params as Record<string, unknown>)[key]
    }
    Object.assign(req.params, clean)
  }

  next()
}