import { useNavigate } from 'react-router-dom'
import { MapPin, Check, X, Clock3, Inbox, Hammer, Image as ImageIcon } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { useWorkerIncoming, useWorkerJobs } from '@/hooks/use-requests'
import { useWorkerProfile } from '@/hooks/use-workers'
import { acceptRequest, rejectRequest } from '@/services/requests.service'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { StatusBadge } from '@/components/status-badge'
import { JobProgressStepper } from '@/components/job-progress'
import { CategoryIcon } from '@/components/category-icon'
import { toastSuccess } from '@/hooks/use-toast'
import { useState } from 'react'
import { timeAgoShort } from '@/lib/utils'
import { haversine } from '@/lib/geo'

export default function WorkerIncoming() {
  const uid = useAuthStore((s) => s.uid)!
  const navigate = useNavigate()
  const { data: requests, isLoading } = useWorkerIncoming(uid)
  const { data: jobs } = useWorkerJobs(uid)
  const { data: profile } = useWorkerProfile(uid)
  const [busyId, setBusyId] = useState<string | null>(null)

  const activeJobs = (jobs ?? []).filter((j) =>
    ['accepted', 'on_the_way', 'arrived', 'in_progress'].includes(j.status),
  )

  async function handle(action: 'accept' | 'reject', requestId: string) {
    setBusyId(requestId)
    if (action === 'accept') {
      const ok = await acceptRequest(requestId, uid)
      if (ok) toastSuccess('Accepted!', 'The customer has been notified. Open WhatsApp to coordinate.')
    } else {
      const ok = await rejectRequest(requestId, uid)
      if (ok) toastSuccess('Declined', 'We’ll let the customer know and they’ll see the next best worker.')
    }
    setBusyId(null)
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-56" />
        {[0, 1].map((i) => <Skeleton key={i} className="h-36 w-full" />)}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 animate-in">
      <div>
        <span className="eyebrow">Worker portal</span>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Incoming requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Customers nearby have requested you. Accept to be matched — or decline to let them move on.
        </p>
      </div>

      {activeJobs.length > 0 && (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 font-display text-lg font-semibold">
              <Hammer className="h-4 w-4 text-primary" /> Active jobs
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/worker/jobs')}>
              History →
            </Button>
          </div>
          <div className="mt-3 space-y-3">
            {activeJobs.map((job) => (
              <div key={job.id} className="paper-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-base font-semibold">{job.title}</p>
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      {job.customerName ?? 'Customer'} · {job.category}
                      <CategoryIcon category={job.category} className="h-3.5 w-3.5" />
                    </p>
                  </div>
                  <StatusBadge status={job.status} />
                </div>
                <JobProgressStepper job={job} onCompleteClick={() => navigate('/worker/jobs')} />
              </div>
            ))}
          </div>
        </section>
      )}

      {!requests || requests.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Nothing pending right now"
          description="When a customer requests you, the alert pops up here in real time — no refresh needed."
          action={
            <Button variant="outline" onClick={() => navigate('/worker/dashboard')}>
              Go to dashboard
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {requests.map((r) => {
            const dist = profile?.g?.geopoint && r.customerLocation
              ? haversine(
                  { latitude: profile.g.geopoint.latitude, longitude: profile.g.geopoint.longitude },
                  { latitude: r.customerLocation.latitude, longitude: r.customerLocation.longitude },
                )
              : null
            return (
              <div key={r.id} className="paper-card animate-list-in p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-semibold">{r.title}</h3>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                      {r.customerName ?? 'Customer'} · {r.category}
                      <CategoryIcon category={r.category} className="h-3.5 w-3.5" />
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" /> {timeAgoShort(r.createdAt)} ago
                  </span>
                </div>

                {r.description && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{r.description}</p>}

                {r.photoUrls && r.photoUrls.length > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <div className="flex gap-1.5 overflow-x-auto">
                      {r.photoUrls.slice(0, 4).map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" className="block shrink-0 overflow-hidden rounded-lg border border-border">
                          <img src={url} alt={`Photo ${i + 1}`} className="h-14 w-14 object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  {dist && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> ~{dist} away
                    </span>
                  )}
                  {r.customerAddress && <span className="truncate">{r.customerAddress}</span>}
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button
                    className="flex-1 gap-2"
                    disabled={busyId === r.id}
                    onClick={() => handle('accept', r.id)}
                  >
                    {busyId === r.id ? <Spinner size={16} /> : <Check className="h-4 w-4" />}
                    Accept & connect
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    disabled={busyId === r.id}
                    onClick={() => handle('reject', r.id)}
                  >
                    <X className="h-4 w-4" /> Decline
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}