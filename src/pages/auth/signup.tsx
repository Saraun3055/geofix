import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Wrench, UserRound, Check } from 'lucide-react'
import { AuthShell } from './auth-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { isLocalApi } from '@/lib/mode'
import { demoSignup } from '@/services/auth.service'
import { apiSignup } from '@/services/local-api'
import { useAuthStore } from '@/stores/auth'
import { toastError } from '@/hooks/use-toast'
import { CATEGORY_LIST } from '@/lib/types'

export default function SignupPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [role, setRole] = useState<'customer' | 'worker'>(params.get('role') === 'worker' ? 'worker' : 'customer')
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [skillError, setSkillError] = useState('')

  function toggleSkill(skill: string) {
    setSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]))
    if (skillError) setSkillError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (role === 'worker' && skills.length === 0) {
      setSkillError('Pick at least one skill you offer')
      return
    }
    if (isLocalApi) {
      if (!name.trim() || !email.trim() || password.length < 8) {
        toastError('Almost there', 'Provide your name, a valid email and a password (min 8 characters)')
        return
      }
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
        toastError('Signup failed', err instanceof Error ? err.message : 'Could not create your account')
      } finally {
        setBusy(false)
      }
      return
    }
    if (!name.trim() || !contact.trim()) {
      toastError('Almost there', 'Please fill in your name and a contact number')
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
            {skillError && <p className="text-xs font-medium text-destructive">{skillError}</p>}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" />
        </div>

        {isLocalApi && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" />
            </div>
          </>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="contact">Phone number</Label>
          <Input
            id="contact"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="+91 98765 43210"
            inputMode="tel"
          />
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