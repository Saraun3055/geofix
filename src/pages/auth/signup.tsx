import { useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Wrench, UserRound, Check, Eye, EyeOff } from 'lucide-react'
import { AuthShell } from './auth-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { isLocalApi } from '@/lib/mode'
import { demoSignup } from '@/services/auth.service'
import { apiSignup, checkPhoneExists, checkEmailExists } from '@/services/local-api'
import { ApiError } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth'
import { toastError } from '@/hooks/use-toast'
import { CATEGORY_LIST } from '@/lib/types'
import { getDemoStore, DEMO_ACCOUNTS } from '@/lib/demo'

const EMAIL_RE = /^\S+@\S+\.\S+$/
const PASSWORD_RE = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
const PASSWORD_MSG = 'Password must be at least 8 characters with one uppercase letter, one number and one special character'

function phoneDigits(p: string): string {
  return String(p ?? '').replace(/\D/g, '')
}

type FieldErrors = { name?: string; email?: string; password?: string; contact?: string; skills?: string }

export default function SignupPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [role, setRole] = useState<'customer' | 'worker'>(params.get('role') === 'worker' ? 'worker' : 'customer')
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [skills, setSkills] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const phoneCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const phoneCheckId = useRef(0)
  const emailCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const emailCheckId = useRef(0)

  function validateFields(): FieldErrors {
    const next: FieldErrors = {}
    if (name.trim().length < 2) next.name = 'Full name must be at least 2 characters'
    if (isLocalApi) {
      if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address'
      if (!PASSWORD_RE.test(password)) next.password = PASSWORD_MSG
    }
    if (contact.trim().length === 0) {
      next.contact = 'A phone number is required'
    } else if (contact.replace(/\D/g, '').length < 10) {
      next.contact = 'Enter a valid phone number (at least 10 digits)'
    }
    if (role === 'worker' && skills.length === 0) next.skills = 'Pick at least one skill you offer'
    return next
  }

  function clearError(field: keyof FieldErrors) {
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  async function checkPhoneDuplicates(value: string) {
    const digits = phoneDigits(value)
    if (digits.length < 10) return
    if (isLocalApi) {
      const exists = await checkPhoneExists(value.trim())
      if (exists) {
        setErrors((prev) => ({ ...prev, contact: 'This phone number is already registered — try another number' }))
      } else {
        setErrors((prev) => (prev.contact?.includes('already registered') ? { ...prev, contact: undefined } : prev))
      }
      return
    }
    const store = getDemoStore()
    const exists = store.workers.some((w) => phoneDigits(w.phone) === digits)
    if (exists) {
      setErrors((prev) => ({ ...prev, contact: 'This phone number is already registered — try another number' }))
    } else {
      setErrors((prev) => (prev.contact?.includes('already registered') ? { ...prev, contact: undefined } : prev))
    }
  }

  function schedulePhoneCheck(value: string) {
    if (phoneCheckTimer.current) clearTimeout(phoneCheckTimer.current)
    const thisCheck = ++phoneCheckId.current
    phoneCheckTimer.current = setTimeout(() => {
      if (phoneCheckId.current === thisCheck) checkPhoneDuplicates(value)
    }, 700)
  }

  async function checkEmailDuplicates(value: string) {
    const email = value.trim().toLowerCase()
    if (!EMAIL_RE.test(email)) return
    if (isLocalApi) {
      const exists = await checkEmailExists(email)
      if (exists) {
        setErrors((prev) => ({ ...prev, email: 'This email is already registered — try another one' }))
      } else {
        setErrors((prev) => (prev.email?.includes('already registered') ? { ...prev, email: undefined } : prev))
      }
      return
    }
    const exists = DEMO_ACCOUNTS.some((a) => a.email.toLowerCase() === email)
    if (exists) {
      setErrors((prev) => ({ ...prev, email: 'This email is already registered — try another one' }))
    } else {
      setErrors((prev) => (prev.email?.includes('already registered') ? { ...prev, email: undefined } : prev))
    }
  }

  function scheduleEmailCheck(value: string) {
    if (emailCheckTimer.current) clearTimeout(emailCheckTimer.current)
    const thisCheck = ++emailCheckId.current
    emailCheckTimer.current = setTimeout(() => {
      if (emailCheckId.current === thisCheck) checkEmailDuplicates(value)
    }, 700)
  }

  function toggleSkill(skill: string) {
    setSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]))
    clearError('skills')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validateFields()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    if (isLocalApi) {
      setBusy(true)
      try {
        const { accessToken, user } = await apiSignup({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          phone: contact.trim(),
          ...(role === 'worker' ? { categorySkills: skills } : {}),
        })
        useAuthStore.getState().setAccessToken(accessToken)
        useAuthStore.getState().setFromApi(user)
        navigate(user.role === 'worker' ? '/worker' : '/customer', { replace: true })
      } catch (err) {
        if (err instanceof ApiError && err.errors) {
          setErrors(err.errors as FieldErrors)
          return
        }
        toastError('Signup failed', err instanceof Error ? err.message : 'Could not create your account')
      } finally {
        setBusy(false)
      }
      return
    }
    setBusy(true)
    try {
      demoSignup(name.trim(), contact.trim(), role, role === 'worker' ? skills : undefined)
      navigate(role === 'worker' ? '/worker' : '/customer', { replace: true })
    } catch (err) {
      toastError('Signup failed', err instanceof Error ? err.message : '')
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Create your account">
      <p className="mt-1 text-sm text-muted-foreground">Tell us who you are — it only takes a minute.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ['customer', 'I need repairs', UserRound],
              ['worker', 'I do repairs', Wrench],
            ] as const
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              onClick={() => setRole(value)}
              className={cn(
                'flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-4 text-sm font-semibold transition-all cursor-pointer',
                role === value
                  ? 'border-primary bg-secondary/70 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/40',
              )}
            >
              <Icon className="h-5 w-5" /> {label}
            </button>
          ))}
        </div>

        {role === 'worker' && (
          <div className="space-y-2">
            <Label>Select your skills</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_LIST.map((cat) => {
                const selected = skills.includes(cat)
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleSkill(cat)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer',
                      selected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/40',
                    )}
                  >
                    {selected && <Check className="h-3.5 w-3.5" />}
                    {cat}
                  </button>
                )
              })}
            </div>
            {errors.skills && <p className="text-xs font-medium text-destructive">{errors.skills}</p>}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => { setName(e.target.value); clearError('name') }}
            onBlur={() => { if (name.trim().length > 0 && name.trim().length < 2) setErrors((prev) => ({ ...prev, name: 'Full name must be at least 2 characters' })) }}
            placeholder="Ada Lovelace"
            aria-invalid={!!errors.name}
          />
          {errors.name && <p className="text-xs font-medium text-destructive">{errors.name}</p>}
        </div>

        {isLocalApi && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  const v = e.target.value
                  setEmail(v)
                  clearError('email')
                  if (EMAIL_RE.test(v.trim())) scheduleEmailCheck(v)
                }}
                onBlur={() => {
                  if (email.trim().length === 0) return
                  if (!EMAIL_RE.test(email.trim()))
                    setErrors((prev) => ({ ...prev, email: 'Enter a valid email address' }))
                  else checkEmailDuplicates(email)
                }}
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={!!errors.email}
              />
              {errors.email && <p className="text-xs font-medium text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError('password') }}
                  onBlur={() => { if (password.length > 0 && !PASSWORD_RE.test(password)) setErrors((prev) => ({ ...prev, password: PASSWORD_MSG })) }}
                  placeholder="At least 8 chars, incl. uppercase, number & symbol"
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
          </>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="contact">Phone number</Label>
          <Input
            id="contact"
            value={contact}
            onChange={(e) => {
              const v = e.target.value
              setContact(v)
              clearError('contact')
              const digits = phoneDigits(v)
              if (digits.length >= 10) schedulePhoneCheck(v)
            }}
            onBlur={() => {
              if (contact.trim().length === 0) return
              if (contact.replace(/\D/g, '').length < 10)
                setErrors((prev) => ({ ...prev, contact: 'Enter a valid phone number (at least 10 digits)' }))
              else checkPhoneDuplicates(contact)
            }}
            placeholder="+91 98765 43210"
            inputMode="tel"
            aria-invalid={!!errors.contact}
          />
          {errors.contact && <p className="text-xs font-medium text-destructive">{errors.contact}</p>}
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={busy}>
          {busy ? 'Creating…' : 'Continue'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary">
            Log in
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}