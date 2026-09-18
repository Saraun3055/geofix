import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, KeyRound, MailCheck } from 'lucide-react'
import { AuthShell } from './auth-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestPasswordReset } from '@/services/local-api'
import { ApiError } from '@/lib/api-client'
import { toastError } from '@/hooks/use-toast'

const EMAIL_RE = /^\S+@\S+\.\S+$/

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState<{ message: string; devCode?: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const clean = email.trim()
    if (!EMAIL_RE.test(clean)) {
      setError('Enter a valid email address')
      return
    }
    setError('')
    setBusy(true)
    try {
      const res = await requestPasswordReset(clean)
      setSent(res)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Could not send a reset request'
      setError(message)
      toastError('Request failed', message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Reset your password">
      <p className="mt-1 text-sm text-muted-foreground">
        Enter the email you signed up with and we'll issue a 6-digit reset code.
      </p>

      {sent ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <div className="flex items-start gap-3">
              <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold">Reset code on its way</p>
                <p className="mt-1 text-xs text-muted-foreground">{sent.message}</p>
                {sent.devCode && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Dev mode: your code is{' '}
                    <span className="rounded bg-foreground px-2 py-0.5 font-mono text-sm font-bold tracking-widest text-background">
                      {sent.devCode}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button className="w-full" onClick={() => navigate('/reset-password', { state: { email } })}>
              Continue to reset
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setSent(null)
                setEmail('')
              }}
            >
              Use a different email
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="fogot-email">Email</Label>
            <Input
              id="fogot-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (error) setError('')
              }}
              autoComplete="email"
              aria-invalid={!!error}
            />
            {error && <p className="text-xs font-medium text-destructive">{error}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Sending…' : 'Send reset code'}
          </Button>
        </form>
      )}

      <div className="mt-4 flex flex-col gap-1 text-sm">
        <Link to="/login" className="inline-flex items-center gap-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to log in
        </Link>
        {!sent && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/70">
            <KeyRound className="h-3 w-3" /> Works for customer, worker & admin accounts.
          </span>
        )}
      </div>
    </AuthShell>
  )
}