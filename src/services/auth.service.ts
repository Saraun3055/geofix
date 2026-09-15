import { useAuthStore } from '@/stores/auth'
import {
  demoSignUp,
  signInDemoAccount,
  DEMO_ACCOUNTS,
  type DemoAccount,
  type DemoAuthUser,
} from '@/lib/demo'

/* ─── Demo-mode auth ───────────────────────────────────────── */

/** Sign into a canned demo account (one-tap from the login page). */
export function demoSignInAccount(acc: DemoAccount): DemoAuthUser {
  const user = signInDemoAccount(acc)
  useAuthStore.getState().setFromDemo(user)
  return user
}

/** Email + password login against the demo account registry. */
export function demoLoginEmail(
  email: string,
  password: string,
): { ok: true; role: DemoAccount['role'] } | { ok: false; message: string } {
  const acc = DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === email.trim().toLowerCase())
  if (!acc) return { ok: false, message: 'No demo account uses that email' }
  if (acc.password !== password) return { ok: false, message: 'Wrong password — try again' }
  demoSignInAccount(acc)
  return { ok: true, role: acc.role }
}

export function demoLoginRole(role: 'customer' | 'worker' | 'admin') {
  const acc = DEMO_ACCOUNTS.find((a) => a.role === role)
  if (!acc) throw new Error(`No demo account for role ${role}`)
  return demoSignInAccount(acc)
}

export function demoSignup(name: string, email: string, role: 'customer' | 'worker', categorySkills?: string[]) {
  const user = demoSignUp(name, email, role, categorySkills)
  useAuthStore.getState().setFromDemo(user)
  return user
}