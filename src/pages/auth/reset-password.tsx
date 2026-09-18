import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react'
import { AuthShell } from './auth-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { resetPassword } from '@/services/local-api'
import { ApiError } from '@/lib/api-client'
import { toastError, toastSuccess } from '@/hooks/use-toast'

const EMAIL_RE = /^\S+@\S+\.\S+$/
const PASSWORD_RE = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
const PASSWORD_MSG = 'At least 8 characters, with one uppercase letter, one number and one special character'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefill = (location.state as { email?: string } | null)?.email ?? ''

  const [email, setEmail] = useState(prefill)
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; code?: string; password?: string; confirm?: string }>({})
  const [busy, setBusy] = useState(false)

  function validate() {
    const next: typeof errors = {}
    if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address'
    if (!/^\d{6}$/.test(code.trim())) next.code = 'Enter the 6-digit reset code'
    if (!PASSWORD_RE.test(password)) next.password = PASSWORD_MSG
    if (confirm !== password) next.confirm = 'Passwords do not match'
    return next
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setBusy(true)
    try {
      const res = await resetPassword({ email: email.trim(), code: code.trim(), password })
      toastSuccess('Password updated', res.message)
      navigate('/login', { replace: true })
    } catch (err) {
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Could not reset your password'
      setErrors((prev) => ({ ...prev, code: undefined, email: undefined, password: undefined, confirm: undefined }))
      toastError('Reset failed', message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Choose a new password">
      <p className="mt-1 text-sm text-muted-foreground">
        Use the 6-digit code you received to set a new password.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="reset-email">Email</Label>
          <Input
            id="reset-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
            }}
            autoComplete="email"
            aria-invalid={!!errors.email}
          />
          {errors.email && <p className="text-xs font-medium text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reset-code">Reset code</Label>
          <Input
            id="reset-code"
            inputMode="numeric"
            placeholder="123456"
            maxLength={6}
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, ''))
              if (errors.code) setErrors((prev) => ({ ...prev, code: undefined }))
            }}
            autoComplete="one-time-code"
            aria-invalid={!!errors.code}
          />
          {errors.code && <p className="text-xs font-medium text-destructive">{errors.code}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="new-pw">New password</Label>
          <div className="relative">
            <Input
              id="new-pw"
              type={showPw ? 'text' : 'password'}
              placeholder={PASSWORD_MSG}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
              }}
              autoComplete="new-password"
              className="pr-10"
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
          {errors.password && <p className="text-xs font-medium text-destructive">{errors.password}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm-pw">Confirm new password</Label>
          <Input
            id="confirm-pw"
            type={showPw ? 'text' : 'password'}
            placeholder="Repeat your new password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value)
              if (errors.confirm) setErrors((prev) => ({ ...prev, confirm: undefined }))
            }}
            autoComplete="new-password"
            aria-invalid={!!errors.confirm}
          />
          {errors.confirm && <p className="text-xs font-medium text-destructive">{errors.confirm}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? 'Updating…' : 'Update password'}
        </Button>
      </form>

      <div className="mt-4 space-y-2 text-sm">
        <Link to="/login" className="inline-flex items-center gap-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to log in
        </Link>
        <Link
          to="/forgot-password"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/70 transition-colors hover:text-foreground"
        >
          <ShieldCheck className="h-3 w-3" /> Didn't get a code? Request a new one
        </Link>
      </div>

      <span className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <LockKeyhole className="h-3.5 w-3.5" /> Works for customer, worker & admin accounts.
      </span>
    </AuthShell>
  )
}