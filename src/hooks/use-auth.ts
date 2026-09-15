import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import { getDemoAuthUser } from '@/lib/demo'
import { isLocalApi } from '@/lib/mode'
import { refreshAccessToken } from '@/lib/api-client'
import { apiMe } from '@/services/local-api'

export function useAuthInit() {
  const isDemoMode = useAuthStore((s) => s.isDemoMode)

  useEffect(() => {
    if (isLocalApi) {
      let cancelled = false
      // Local API: restore the session from the httpOnly refresh cookie, then
      // hydrate the profile. `refreshAccessToken` stores the JWT in memory.
      refreshAccessToken().then(async (ok) => {
        if (cancelled) return
        if (!ok) {
          useAuthStore.setState({ status: 'unauthenticated' })
          return
        }
        const me = await apiMe()
        if (cancelled) return
        if (me) {
          useAuthStore.getState().setFromApi(me)
        } else {
          useAuthStore.setState({ status: 'unauthenticated' })
        }
      })
      return () => {
        cancelled = true
      }
    }
    // Demo mode: restore from localStorage on mount
    if (isDemoMode) {
      const demoUser = getDemoAuthUser()
      if (demoUser) useAuthStore.getState().setFromDemo(demoUser)
      else useAuthStore.setState({ status: 'unauthenticated' })
    }
  }, [isDemoMode])
}