import { create } from 'zustand'
import { dataMode, isDemo, isLocalApi, type DataMode } from '@/lib/mode'
import type { UserDoc } from '@/lib/types'
import {
  getDemoAuthUser,
  setDemoAuthUser,
  type DemoAuthUser,
} from '@/lib/demo'

export type AuthState = {
  uid: string | null
  name: string | null
  email: string | null
  phone: string | null
  pincode?: string | null
  area?: string | null
  role: 'customer' | 'worker' | 'admin' | null
  adminRole?: 'superadmin' | 'support'
  status: 'loading' | 'authenticated' | 'unauthenticated'
  /** Which data source is active: demo (localStorage) or local-api. */
  dataMode: DataMode
  /** true if we're in demo/mock mode */
  isDemoMode: boolean
  /** JWT used only in `local-api` mode; kept in memory (never localStorage). */
  accessToken: string | null
  setAccessToken: (token: string | null) => void
  signOut: () => void
  setFromDemo: (user: DemoAuthUser) => void
  setFromApi: (user: UserDoc) => void
  /** Update editable profile details (name / phone / home area) after a save. */
  applyProfile: (name: string | null, phone?: string | null, opts?: { pincode?: string | null; area?: string | null }) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  uid: null,
  name: null,
  email: null,
  phone: null,
  pincode: null,
  area: null,
  role: null,
  adminRole: undefined,
  status: 'loading',
  dataMode,
  isDemoMode: isDemo,
  accessToken: null,

  setAccessToken: (accessToken) => set({ accessToken }),

  signOut: () => {
    set({ uid: null, name: null, email: null, phone: null, pincode: null, area: null, role: null, adminRole: undefined, accessToken: null, status: 'unauthenticated' })
    setDemoAuthUser(null)
    if (isLocalApi) {
      import('@/services/local-api').then((m) => m.apiLogout()).catch(() => undefined)
    }
  },

  setFromDemo: (user) => {
    set({
      uid: user.uid,
      name: user.name,
      email: user.email,
      phone: user.phone ?? null,
      pincode: user.pincode ?? null,
      area: user.area ?? null,
      role: user.role,
      adminRole: user.adminRole,
      status: 'authenticated',
      isDemoMode: true,
      accessToken: null,
    })
  },

  setFromApi: (user) => {
    setDemoAuthUser(null) // never let a stale demo identity leak into a real session
    set({
      uid: user.uid,
      name: user.name,
      email: user.email ?? null,
      phone: user.phone ?? null,
      pincode: user.pincode ?? null,
      area: user.area ?? null,
      role: user.role,
      adminRole: user.adminRole,
      status: 'authenticated',
      isDemoMode: false,
      accessToken: useAuthStore.getState().accessToken,
    })
  },

  applyProfile: (name, phone, opts) => {
    set((s) => ({
      name: name ?? s.name,
      phone: phone !== undefined && phone !== null ? (phone === '' ? null : phone) : s.phone,
      pincode: opts?.pincode !== undefined ? opts.pincode : s.pincode,
      area: opts?.area !== undefined ? opts.area : s.area,
    }))
  },
}))

// Restore demo auth on load (only when actually in demo mode)
if (isDemo) {
  const demoUser = getDemoAuthUser()
  if (demoUser) {
    useAuthStore.getState().setFromDemo(demoUser)
  } else {
    useAuthStore.setState({ status: 'unauthenticated' })
  }
}