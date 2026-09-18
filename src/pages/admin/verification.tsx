import { useState } from 'react'
import { ShieldCheck, Check, X, FileBadge, Clock } from 'lucide-react'
import { useVerificationQueue } from '@/hooks/use-admin'
import { approveWorkerVerification, rejectWorkerVerification } from '@/services/admin.service'
import { useAuthStore } from '@/stores/auth'
import { useAllWorkers } from '@/hooks/use-workers'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/empty-state'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type QueueStatus = 'pending' | 'approved' | 'rejected' | 'all'

const QUEUE_TABS: { value: QueueStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
]

export default function AdminVerification() {
  const admin = useAuthStore((s) => s.uid) ?? 'admin'
  const [status, setStatus] = useState<QueueStatus>('pending')
  const { data: queue, isLoading } = useVerificationQueue(status)
  const { data: workers } = useAllWorkers()
  const [target, setTarget] = useState<{ workerId: string; action: 'approve' | 'reject' } | null>(null)
  const [busy, setBusy] = useState(false)

  async function run() {
    if (!target) return
    setBusy(true)
    if (target.action === 'approve') {
      await approveWorkerVerification(target.workerId, admin)
    } else {
      await rejectWorkerVerification(target.workerId, admin)
    }
    setBusy(false)
    setTarget(null)
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-8 w-64" />
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 animate-in">
      <div>
        <span className="eyebrow">Admin · verification</span>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Worker verification queue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review government IDs submitted by workers. Only approved workers appear in customer results.
        </p>
      </div>

      <div className="flex gap-1 rounded-lg border border-border bg-card p-1 text-xs font-medium">
        {QUEUE_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setStatus(t.value)}
            className={cn(
              'rounded-md px-3 py-1.5 transition-colors cursor-pointer',
              status === t.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
            <span className="ml-1 font-normal opacity-70">
              {t.value === 'all' ? '' : '·'}
            </span>
          </button>
        ))}
      </div>

      {!queue || queue.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title={status === 'pending' ? 'Queue is clear' : 'Nothing here'}
          description={
            status === 'pending'
              ? 'There are no pending verifications right now. New submissions will appear here in real time.'
              : `No ${status === 'all' ? '' : status} submissions to show.`
          }
        />
      ) : (
        <div className="space-y-4">
          {queue.map((item) => {
            const worker = workers?.find((w) => w.userId === item.workerId)
            return (
              <div key={item.workerId} className="paper-card paper-card-hover animate-list-in p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-sm font-bold text-secondary-foreground">
                      {(item.workerName ?? item.workerId).split(' ').map((p) => p[0]).join('')}
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-semibold">{item.workerName ?? item.workerId}</h3>
                      <p className="text-sm text-muted-foreground">
                        {worker?.categorySkills.join(' · ') ?? '—'} · <span className="font-mono">{item.workerId}</span>
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" /> Submitted {formatRelativeTime(item.submittedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="success"
                      className="gap-1.5"
                      onClick={() => setTarget({ workerId: item.workerId, action: 'approve' })}
                    >
                      <Check className="h-4 w-4" /> Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-1.5 text-destructive"
                      onClick={() => setTarget({ workerId: item.workerId, action: 'reject' })}
                    >
                      <X className="h-4 w-4" /> Reject
                    </Button>
                  </div>
                </div>

                {item.govIdUrl && (
                  <div className="mt-4 rounded-xl border border-border bg-muted/40 p-3">
                    {item.govIdUrl.startsWith('data:') ? (
                      <img src={item.govIdUrl} alt="Government ID" className="mx-auto max-h-44 rounded-lg border border-border" />
                    ) : (
                      <a
                        href={item.govIdUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                      >
                        <FileBadge className="h-4 w-4" /> Open submitted ID
                      </a>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <AlertDialog open={target !== null} onOpenChange={(o) => !o && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {target?.action === 'approve' ? 'Approve this worker?' : 'Reject this worker?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {target?.action === 'approve'
                ? 'The worker becomes visible in customer results with a verified badge.'
                : 'The worker is removed from customer results and will be asked to resubmit a clearer ID.'}
              This action is written to the audit log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={run}
              disabled={busy}
              className={target?.action === 'reject' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {busy ? 'Saving…' : target?.action === 'approve' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}