import { useNavigate } from 'react-router-dom'
import {
  Wifi,
  WifiOff,
  Star,
  Briefcase,
  TrendingUp,
  Clock,
  ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { useWorkerProfile } from '@/hooks/use-workers'
import { useWorkerIncoming, useWorkerJobs } from '@/hooks/use-requests'
import { Stars } from '@/components/stars'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { timeAgoShort, cn } from '@/lib/utils'
import { getDemoStore, persistDemoStore } from '@/lib/demo'
import { isLocalApi } from '@/lib/mode'
import { setWorkerAvailability } from '@/services/local-api'
import { toastError, toastSuccess } from '@/hooks/use-toast'

export default function WorkerDashboard() {
  const uid = useAuthStore((s) => s.uid)!
  const navigate = useNavigate()
  const { data: profile, isLoading } = useWorkerProfile(uid)
  const incoming = useWorkerIncoming(uid)
  const jobs = useWorkerJobs(uid)

  async function toggleOnline() {
    if (!profile) return
    const next = !profile.isOnline
    try {
      if (isLocalApi) {
        await setWorkerAvailability(uid, next)
        toastSuccess(next ? 'Online' : 'Offline', next ? 'You’ll now receive nearby job requests' : 'You’re hidden from new requests')
        return
      }
      const store = getDemoStore()
      const target = store.workers.find((w) => w.userId === uid)
      if (target) {
        target.isOnline = next
        persistDemoStore(store)
      }
      toastSuccess(next ? 'Online' : 'Offline', next ? 'You’ll now receive nearby job requests' : 'You’re hidden from new requests')
    } catch (e) {
      toastError('Update failed', e instanceof Error ? e.message : '')
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-36 w-full" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      </div>
    )
  }

  const completedJobs = jobs.data?.filter((j) => j.status === 'completed') ?? []

  return (
    <div className="mx-auto max-w-4xl space-y-7 animate-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="eyebrow">Worker dashboard</span>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">
            Good to see you, {profile?.name.split(' ')[0] ?? 'pro'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile?.categorySkills.join(' · ')} · working in your area
          </p>
        </div>
        <AvailabilityToggle online={profile?.isOnline ?? false} onToggle={toggleOnline} />
      </div>

      {/* Hero stat band */}
      <div className="paper-card relative overflow-hidden p-0">
        <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-accent/15 blur-2xl" />
        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Your current rating</p>
            <div className="mt-2 flex items-end gap-3">
              <span className="stat-number text-5xl font-bold tracking-tight">{profile?.rating.toFixed(1) ?? '—'}</span>
              <div className="pb-1.5">
                <Stars value={profile?.rating ?? 0} size={18} />
                <p className="stat-number mt-1 text-xs text-muted-foreground">{profile?.ratingCount ?? 0} ratings</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">
            {[
              { label: 'Jobs done', value: String(profile?.jobsCompleted ?? 0), icon: Briefcase },
              { label: 'Avg response', value: profile?.avgResponseMin ? `${profile.avgResponseMin}m` : '—', icon: Clock },
              { label: 'Verification', value: profile?.verificationStatus ?? '—', icon: TrendingUp },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-background/60 px-4 py-3">
                <s.icon className="mb-1.5 h-4 w-4 text-primary" />
                <p className="stat-number text-xl font-bold">{s.value}</p>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Incoming requests */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Incoming requests</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/worker/incoming')}>
            View all <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {incoming.data && incoming.data.length > 0 ? (
          <div className="mt-3 space-y-3">
            {incoming.data.slice(0, 3).map((r) => (
              <div key={r.id} className="paper-card paper-card-hover p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-base font-semibold">{r.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {r.customerName} · {r.category} · {timeAgoShort(r.createdAt)} ago
                    </p>
                  </div>
                  <Button size="sm" onClick={() => navigate('/worker/incoming')}>
                    Respond
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-dashed border-border bg-muted/30 px-5 py-8 text-center text-sm text-muted-foreground">
            No pending requests. Stay online above to start receiving them.
          </div>
        )}
      </section>

      {/* Recent jobs */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Recent jobs</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/worker/jobs')}>
            History <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {completedJobs.length > 0 ? (
          <div className="mt-3 space-y-3">
            {completedJobs.slice(0, 4).map((r) => (
              <div key={r.id} className="paper-card flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <Star className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{r.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.customerName} · completed {timeAgoShort(r.completedAt ?? r.createdAt)} ago
                    </p>
                  </div>
                </div>
                <Badge variant="success">Complete</Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No completed jobs yet.</p>
        )}
      </section>
    </div>
  )
}

function AvailabilityToggle({ online, onToggle }: { online: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors cursor-pointer',
        online ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-border bg-muted text-muted-foreground',
      )}
    >
      {online ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
      {online ? 'Online' : 'Offline'}
      <span className={cn('h-2 w-2 rounded-full', online ? 'bg-emerald-500' : 'bg-muted-foreground/50')} />
    </button>
  )
}