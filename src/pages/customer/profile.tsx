import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UserRound, Phone, Mail, MapPin, ArrowUpRight, Package, CheckCircle2, Clock3, Pencil, Loader2, X } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/status-badge'
import { CategoryIcon } from '@/components/category-icon'
import { useAuthStore } from '@/stores/auth'
import { useMyRequests } from '@/hooks/use-requests'
import { updateMyProfile } from '@/services/profile.service'
import { toastError, toastSuccess } from '@/hooks/use-toast'

export default function CustomerProfile() {
  const uid = useAuthStore((s) => s.uid)
  const name = useAuthStore((s) => s.name) ?? 'Customer'
  const email = useAuthStore((s) => s.email)
  const phone = useAuthStore((s) => s.phone)

  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState(name)
  const [phoneInput, setPhoneInput] = useState(phone ?? '')
  const [saving, setSaving] = useState(false)

  const { data: requests = [], isLoading } = useMyRequests(uid)

  const active = requests.filter((r) =>
    ['searching', 'pending_worker_response', 'accepted', 'on_the_way', 'arrived', 'in_progress'].includes(r.status),
  )
  const completed = requests.filter((r) => r.status === 'completed')

  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const stats = [
    { label: 'Total requests', value: requests.length, icon: Package },
    { label: 'Active', value: active.length, icon: Clock3 },
    { label: 'Completed', value: completed.length, icon: CheckCircle2 },
  ]

  function startEditing() {
    setNameInput(name)
    setPhoneInput(phone ?? '')
    setEditing(true)
  }

  async function save() {
    if (!nameInput.trim()) {
      toastError('Name required', 'Your display name can’t be empty.')
      return
    }
    setSaving(true)
    const ok = await updateMyProfile({ name: nameInput, phone: phoneInput })
    setSaving(false)
    if (ok) {
      toastSuccess('Profile updated', 'Your profile details have been saved.')
      setEditing(false)
    } else {
      toastError('Save failed', 'Please try again in a moment.')
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
              {initials || <UserRound className="h-8 w-8" />}
            </div>
            <div>
              <div className="truncate text-2xl font-semibold">{name}</div>
              <CardDescription>Customer portal</CardDescription>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          {!editing ? (
            <>
              <span className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" /> {email ?? '—'}
              </span>
              <span className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" /> {phone ?? '—'}
              </span>
              <span className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" /> Location shared per request
              </span>
            </>
          ) : (
            <div className="col-span-full grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={nameInput} onChange={(e) => setNameInput(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} placeholder="+91…" className="h-10" />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-end">
          {!editing ? (
            <Button variant="outline" size="sm" onClick={startEditing} className="gap-1.5">
              <Pencil className="h-3.5 w-3.5" /> Edit profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="gap-1.5">
                <X className="h-3.5 w-3.5" /> Cancel
              </Button>
              <Button size="sm" onClick={save} disabled={saving} className="gap-1.5">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-3.5 w-3.5" />}
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <s.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-semibold leading-none">{isLoading ? '…' : s.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent requests</CardTitle>
          <CardDescription>Your service requests on GeoFix.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {!isLoading && requests.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No requests yet.{' '}
              <Link to="/customer/new" className="text-primary hover:underline">
                Create your first one
              </Link>
            </p>
          )}
          {requests.slice(0, 5).map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div className="min-w-0">
                <div className="truncate font-medium">{r.title}</div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <CategoryIcon category={r.category} className="h-3.5 w-3.5" /> {r.category}
                  {r.workerName && <span>· {r.workerName}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={r.status} />
                <Link to={`/customer/requests/${r.id}`} aria-label="View request">
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}