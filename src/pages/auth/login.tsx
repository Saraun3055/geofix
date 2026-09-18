import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { AuthShell } from './auth-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isLocalApi } from '@/lib/mode'
import {
  demoLoginEmail,
  demoSignInAccount,
} from '@/services/auth.service'
import { apiLogin } from '@/services/local-api'
import { useAuthStore } from '@/stores/auth'
import { toastError } from '@/hooks/use-toast'
import { DEMO_ACCOUNTS } from '@/lib/demo'
import { Badge } from '@/components/ui/badge'

function portalFor(role: string) {
  return role === 'admin' ? '/admin' : role === 'worker' ? '/worker' : '/customer'
}

const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const role = useAuthStore((s) => s.role)
  const [showPw, setShowPw] = useState(false)
  const [busy, setBusy] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: LoginFormValues) {
    setBusy(true)
    try {
      if (isLocalApi) {
        const { accessToken, user } = await apiLogin(values.email, values.password)
        useAuthStore.getState().setAccessToken(accessToken)
        useAuthStore.getState().setFromApi(user)
        navigate(portalFor(user.role), { replace: true })
      } else {
        const res = demoLoginEmail(values.email, values.password)
        if (!res.ok) throw new Error(res.message)
        navigate(portalFor(res.role), { replace: true })
      }
    } catch (err) {
      toastError('Login failed', err instanceof Error ? err.message : 'Check credentials and retry')
    } finally {
      setBusy(false)
    }
  }

  function handleAccount(acc: (typeof DEMO_ACCOUNTS)[number]) {
    demoSignInAccount(acc)
    navigate(portalFor(acc.role), { replace: true })
  }

  return (
    <AuthShell title="Log in to GeoFix">
      <p className="mt-1 text-sm text-muted-foreground">
        {isLocalApi
          ? 'Sign in with your local GeoFix account.'
          : 'Each account below is ready to use — no sign-up required.'}
      </p>

      {isLocalApi ? (
        /* ──────────── Local API accounts ──────────── */
        <div className="mt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="api-email">Email</Label>
              <Input id="api-email" type="email" placeholder="worker.demo@geofix.app" {...register('email')} aria-invalid={!!errors.email} />
              {errors.email && <p className="text-xs font-medium text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="api-pw">Password</Label>
              <div className="relative">
                <Input
                  id="api-pw"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pr-10"
                  {...register('password')}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs font-medium text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              New to GeoFix?{' '}
              <Link to="/signup" className="font-medium text-primary">
                Create an account
              </Link>
            </p>
          </form>
        </div>
      ) : (
        /* ──────────── Demo accounts ──────────── */
        <div className="mt-6 space-y-5">
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Demo accounts · one tap or type the credentials
            </p>
          </div>

          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.uid}
                onClick={() => handleAccount(acc)}
                className="group flex w-full items-center gap-4 rounded-xl border border-border bg-card p-3.5 text-left transition-colors hover:border-primary/50 hover:bg-secondary/30 cursor-pointer"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-sm font-bold text-secondary-foreground">
                  {acc.name.split(' ').map((p) => p[0]).join('')}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{acc.name}</span>
                    <Badge variant={acc.role === 'admin' ? 'default' : acc.role === 'worker' ? 'warning' : 'secondary'} className="text-[10px]">
                      {acc.role}
                    </Badge>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{acc.note}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground/70">
                    {acc.email} · {acc.password}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary" />
              </button>
            ))}
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-xs font-medium text-muted-foreground">Or sign in with credentials</p>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-wrap items-center gap-2" noValidate>
              <Input className="min-w-[120px] flex-1" placeholder="Email" type="email" {...register('email')} aria-invalid={!!errors.email} />
              <div className="relative w-32">
                <Input
                  placeholder="Password"
                  type={showPw ? 'text' : 'password'}
                  className="w-32 pr-8"
                  {...register('password')}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button type="submit" className="shrink-0">Sign in</Button>
            </form>
            {(errors.email || errors.password) && (
              <div className="mt-2 space-y-1">
                {errors.email && <p className="text-xs font-medium text-destructive">{errors.email.message}</p>}
                {errors.password && <p className="text-xs font-medium text-destructive">{errors.password.message}</p>}
              </div>
            )}
          </div>

          <p className="text-center text-sm text-muted-foreground">
            New to GeoFix?{' '}
            <Link to="/signup" className="font-medium text-primary">
              Create an account
            </Link>
          </p>
        </div>
      )}

      {role && (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          You're signed in as {role}.{' '}
          <Link to="/portal" className="text-primary underline underline-offset-2">
            Continue →
          </Link>
        </p>
      )}
    </AuthShell>
  )
}