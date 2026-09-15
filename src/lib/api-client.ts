import { API_BASE_URL } from './mode'
import { useAuthStore } from '@/stores/auth'

/**
 * Minimal fetch wrapper for the local Express API.
 * - Attaches the in-memory JWT (`stores/auth.ts`) to every request.
 * - On 401, tries `/auth/refresh` once via the httpOnly cookie, then retries.
 * - Resolves JSON (or undefined on 204) and throws `ApiError` on failures.
 */
export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type RequestInitOverrides = Omit<RequestInit, 'body' | 'method'>

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`
  const token = useAuthStore.getState().accessToken
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(url, {
    ...init,
    headers,
    credentials: 'include',
  })

  if (res.status === 401 && token) {
    const refreshed = await refreshAccessToken()
    if (refreshed) return request<T>(path, init)
  }

  if (!res.ok) {
    let message = res.statusText || `Request failed (${res.status})`
    try {
      const body = (await res.json()) as { message?: string }
      if (body?.message) message = body.message
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(message, res.status)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const api = {
  get: <T>(path: string, options?: RequestInitOverrides) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestInitOverrides) =>
    request<T>(path, { ...options, method: 'POST', body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown, options?: RequestInitOverrides) =>
    request<T>(path, { ...options, method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  delete: <T>(path: string, options?: RequestInitOverrides) => request<T>(path, { ...options, method: 'DELETE' }),
}

/** Exchange the httpOnly refresh cookie for a fresh access token. */
export async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!res.ok) return false
    const data = (await res.json()) as { accessToken: string }
    useAuthStore.setState({ accessToken: data.accessToken, status: 'authenticated' })
    return true
  } catch {
    return false
  }
}