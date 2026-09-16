import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { UserRound, MapPin, Star, Inbox, ArrowUpRight, Loader2, Plus, X } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge } from '@/components/status-badge'
import { useAuthStore } from '@/stores/auth'
import { useWorkerProfile } from '@/hooks/use-workers'
import { useWorkerIncoming } from '@/hooks/use-requests'
import { updateWorkerProfile } from '@/services/workers.service'
import { toastSuccess, toastError } from '@/hooks/use-toast'
import { CATEGORY_LIST, type AvailabilitySlot } from '@/lib/types'
import { cn } from '@/lib/utils'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function slotLabel(s: AvailabilitySlot) {
  const fmt = (t: string) => {
    const [h, m] = t.split(':').map(Number)!
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
  }
  return `${s.day} · ${fmt(s.from)}–${fmt(s.to)}`
}

export default function WorkerProfile() {
  const uid = useAuthStore((s) => s.uid)
  const name = useAuthStore((s) => s.name) ?? 'Worker'
  const { data: profile, isLoading: profileLoading } = useWorkerProfile(uid)
  const { data: incoming = [], isLoading: incomingLoading } = useWorkerIncoming(uid)

  const [editing, setEditing] = useState(false)
  const [skills, setSkills] = useState<string[]>([])
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [newDay, setNewDay] = useState('Mon')
  const [newFrom, setNewFrom] = useState('09:00')
  const [newTo, setNewTo] = useState('13:00')
  const [saving, setSaving] = useState(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (profile && !editing) {
      setSkills([...(profile.categorySkills ?? [])])
      setSlots([...(profile.availableSlots ?? [])])
    }
  }, [profile?.userId, editing])

  const initials = (profile?.name ?? name)
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  function toggleSkill(s: string) {
    setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  }

  function addSlot() {
    if (!newFrom || !newTo || newFrom >= newTo) return
    if (slots.some((s) => s.day === newDay && s.from === newFrom && s.to === newTo)) return
    setSlots((prev) => [...prev, { day: newDay, from: newFrom, to: newTo }])
  }

  function removeSlot(i: number) {
    setSlots((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function save() {
    if (!uid) return
    if (skills.length === 0) {
      toastError('Skills required', 'Pick at least one skill you offer.')
      return
    }
    setSaving(true)
    const ok = await updateWorkerProfile(uid, { categorySkills: skills, availableSlots: slots })
    setSaving(false)
    if (ok) {
      toastSuccess('Profile saved', 'Skills and availability updated.')
      setEditing(false)
    } else {
      toastError('Save failed', 'Please try again.')
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
              <div className="truncate text-2xl font-semibold">{profile?.name ?? name}</div>
              <CardDescription>
                {profile?.isOnline ? 'Online · available for jobs' : 'Offline'}
                {profile?.verificationStatus
                  ? ` · ${profile.verificationStatus === 'approved'
                      ? 'verified'
                      : profile.verificationStatus === 'rejected'
                        ? 'verification rejected'
                        : profile.govIdUrl
                          ? 'verification in progress'
                          : 'verification pending'}`
                  : ''}
              </CardDescription>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex flex-wrap gap-3 text-muted-foreground">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> {profile?.address ?? 'Location shared per job'}
            </span>
            <span className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {profile?.rating ? profile.rating.toFixed(1) : 'New'} ({profile?.ratingCount ?? 0})
            </span>
            <span className="flex items-center gap-2">
              <Inbox className="h-4 w-4" /> {incomingLoading ? '…' : incoming.length} incoming jobs
            </span>
          </div>

          {profileLoading ? (
            <p className="text-muted-foreground">Loading profile…</p>
          ) : !editing ? (
            <div className="space-y-3">
              {profile && profile.categorySkills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {profile.categorySkills.map((c) => (
                    <Badge key={c} variant="secondary">{c}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No skill categories set yet.</p>
              )}
              {profile && profile.availableSlots.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {profile.availableSlots.map((s, i) => (
                    <Badge key={i} variant="outline" className="font-normal">{slotLabel(s)}</Badge>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Skills</Label>
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
                        {selected && <span className="h-3.5 w-3.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[9px] font-bold">✓</span>}
                        {cat}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Availability slots</Label>
                <p className="text-xs text-muted-foreground">
                  Customers see these when you're offline, so they know when you're back.
                </p>
                {slots.length > 0 && (
                  <div className="space-y-2">
                    {slots.map((s, i) => (
                      <div key={`${s.day}-${s.from}-${i}`} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
                        <span className="text-sm font-medium">{slotLabel(s)}</span>
                        <button onClick={() => removeSlot(i)} className="ml-2 text-muted-foreground hover:text-destructive cursor-pointer">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap items-end gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Day</Label>
                    <Select value={newDay} onValueChange={setNewDay}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">From</Label>
                    <Input type="time" value={newFrom} onChange={(e) => setNewFrom(e.target.value)} className="w-[120px]" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">To</Label>
                    <Input type="time" value={newTo} onChange={(e) => setNewTo(e.target.value)} className="w-[120px]" />
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addSlot} className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> Add
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit profile</Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setEditing(false); if (profile) { setSkills([...profile.categorySkills]); setSlots([...profile.availableSlots ?? []]) } }}>Cancel</Button>
              <Button size="sm" onClick={save} disabled={saving}>
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : 'Save changes'}
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Inbox className="h-4 w-4 text-muted-foreground" />
            Incoming jobs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {incomingLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!incomingLoading && incoming.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nothing waiting.{' '}
              <Link to="/worker/incoming" className="text-primary hover:underline">
                Go to incoming
              </Link>
            </p>
          )}
          {incoming.slice(0, 3).map((req) => (
            <div key={req.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div className="min-w-0">
                <div className="truncate font-medium">{req.title}</div>
                <div className="text-xs text-muted-foreground">{req.category}</div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={req.status} />
                <Link to="/worker/incoming" aria-label="Respond">
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