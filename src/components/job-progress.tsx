import { Fragment, useState } from 'react'
import { Check, History, MapPin, Navigation, Hammer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { updateJobProgress } from '@/services/requests.service'
import { toastError, toastSuccess } from '@/hooks/use-toast'
import type { JobProgressStatus, RequestStatus, ServiceRequestDoc } from '@/lib/types'

const PROGRESS_STEPS: { key: RequestStatus; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'accepted', label: 'Accepted', icon: Check },
  { key: 'on_the_way', label: 'On the way', icon: Navigation },
  { key: 'arrived', label: 'Arrived', icon: MapPin },
  { key: 'in_progress', label: 'Working', icon: Hammer },
]

const ACTION: Partial<Record<RequestStatus, { label: string; next?: JobProgressStatus }>> = {
  accepted: { label: 'Mark On the Way', next: 'on_the_way' },
  on_the_way: { label: 'Mark Arrived at Customer Location', next: 'arrived' },
  arrived: { label: 'Start Work', next: 'in_progress' },
  in_progress: { label: 'Complete & Send Bill' },
}

const UPDATE_LABEL: Record<RequestStatus, string> = {
  searching: 'Searching for worker',
  pending_worker_response: 'Worker notified',
  accepted: 'Job accepted',
  on_the_way: 'Worker on the way',
  arrived: 'Worker arrived at location',
  in_progress: 'Work started',
  rejected: 'Worker declined',
  completed: 'Job completed',
  cancelled: 'Request cancelled',
}

export function JobProgressStepper({
  job,
  onCompleteClick,
}: {
  job: ServiceRequestDoc
  onCompleteClick: (job: ServiceRequestDoc) => void
}) {
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')

  const currentIdx = PROGRESS_STEPS.findIndex((s) => s.key === job.status)
  const action = ACTION[job.status]
  if (currentIdx === -1 || !action) return null

  const updates = job.jobUpdates ?? []

  async function advance() {
    if (!action?.next) return
    setBusy(true)
    const ok = await updateJobProgress(job.id, action.next, note.trim() || undefined)
    setBusy(false)
    if (ok) {
      setNote('')
      toastSuccess(action.label, `Job updated — ${UPDATE_LABEL[action.next].toLowerCase()}.`)
    } else {
      toastError('Update failed', 'Could not update this job right now.')
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-border bg-muted/20 p-4">
      {/* Stepper */}
      <div className="flex items-start">
        {PROGRESS_STEPS.map((step, i) => {
          const reached = i <= currentIdx
          const isCurrent = i === currentIdx
          const Icon = step.icon
          return (
            <Fragment key={step.key}>
              {i > 0 && (
                <div className={cn('mt-3.5 h-0.5 min-w-3 flex-1 rounded-full', i <= currentIdx ? 'bg-primary' : 'bg-border')} />
              )}
              <div className="flex min-w-0 flex-col items-center gap-1">
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all',
                    reached
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground',
                    isCurrent && 'ring-4 ring-primary/20',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span
                  className={cn(
                    'whitespace-nowrap text-[10px] font-medium',
                    reached ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>
              </div>
            </Fragment>
          )
        })}
      </div>

      {/* Action + note */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        {action.next ? (
          <>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={`Note for “${action.label.toLowerCase()}” (optional)`}
              className="sm:max-w-xs"
            />
            <Button size="sm" onClick={advance} disabled={busy}>
              {busy ? <Spinner size={14} /> : null}
              {action.label}
            </Button>
          </>
        ) : (
          <Button size="sm" onClick={() => onCompleteClick(job)}>
            {action.label}
          </Button>
        )}
      </div>

      {/* Timeline log */}
      {updates.length > 0 && (
        <div className="mt-4 border-t border-border/60 pt-3">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <History className="h-3 w-3" /> Update timeline
          </p>
          <ol className="space-y-2.5">
            {updates.map((u, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0">
                  <p className="font-medium">{UPDATE_LABEL[u.status] ?? u.status}</p>
                  {u.note && <p className="text-muted-foreground">{u.note}</p>}
                  <p className="stat-number text-[11px] text-muted-foreground/70">
                    {new Date(u.timestamp).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}