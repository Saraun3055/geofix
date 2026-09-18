import { useState } from 'react'
import { ShieldCheck, ShieldAlert, ListChecks, Users, Phone, Pencil, Loader2, X } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth'
import { useVerificationQueue, useActiveRequestsStats } from '@/hooks/use-admin'
import { updateMyProfile } from '@/services/profile.service'
import { toastError, toastSuccess } from '@/hooks/use-toast'

export default function AdminProfile() {
  const name = useAuthStore((s) => s.name) ?? 'Admin'
  const email = useAuthStore((s) => s.email)
  const phone = useAuthStore((s) => s.phone)
  const adminRole = useAuthStore((s) => s.adminRole)

  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState(name)
  const [phoneInput, setPhoneInput] = useState(phone ?? '')
  const [saving, setSaving] = useState(false)

  const queue = useVerificationQueue()
  const stats = useActiveRequestsStats()

  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const cards = [
    { label: 'Verification queue', value: queue.data?.length ?? 0, icon: ShieldCheck, to: '/admin/verification' },
    { label: 'Active requests', value: stats.data?.total ?? 0, icon: ListChecks, to: '/admin/requests' },
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
      toastSuccess('Profile updated', 'Your admin profile details have been saved.')
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
              {initials || <ShieldAlert className="h-8 w-8" />}
            </div>
            <div>
              <div className="text-2xl font-semibold">{name}</div>
              <CardDescription className="flex items-center gap-1.5">
                {adminRole === 'superadmin' ? 'Superadmin' : 'Support agent'} · GeoFix admin
              </CardDescription>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid gap-3 text-muted-foreground sm:grid-cols-2">
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" /> {email ?? 'admin@geofix.app'}
            </span>
            <span className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> {phone ?? '—'}
            </span>
          </div>
          {editing && (
            <div className="grid gap-3 pt-1 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="admin-name">Full name</Label>
                <Input id="admin-name" value={nameInput} onChange={(e) => setNameInput(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-phone">Phone</Label>
                <Input id="admin-phone" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} placeholder="+91…" className="h-10" />
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

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <a key={c.label} href={c.to} className="block">
            <Card className="transition-colors hover:border-primary/50">
              <CardContent className="flex items-center gap-3 p-4">
                <c.icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-xl font-semibold leading-none">{c.value}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{c.label}</div>
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  )
}