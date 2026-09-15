/**
 * The app supports two data sources:
 *  - `local-api` → Express + MongoDB Atlas backend (server/) [DEFAULT]
 *  - `demo`      → localStorage fallback (src/lib/demo.ts)
 */
export type DataMode = 'demo' | 'local-api'

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:4000'

export function resolveDataMode(): DataMode {
  if (import.meta.env.VITE_DATA_MODE === 'demo') return 'demo'
  return 'local-api'
}

export const dataMode: DataMode = resolveDataMode()

export const isDemo = dataMode === 'demo'
export const isLocalApi = dataMode === 'local-api'