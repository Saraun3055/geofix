import { useMemo, useState } from 'react'
import { ListChecks, Search, ChevronDown } from 'lucide-react'
import { useAllRequests } from '@/hooks/use-requests'
import { StatusBadge } from '@/components/status-badge'
import { CategoryIcon } from '@/components/category-icon'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/empty-state'
import { formatRelativeTime } from '@/lib/utils'
import { CATEGORY_LIST, type RequestStatus, type ServiceRequestDoc } from '@/lib/types'

const STATUSES: (RequestStatus | 'all')[] = [
  'all',
  'searching',
  'pending_worker_response',
  'accepted',
  'on_the_way',
  'arrived',
  'in_progress',
  'completed',
  'cancelled',
  'rejected',
]

const UPDATE_ENTRY: Record<string, { label: string; note: string }> = {
  accepted: { label: 'Worker accepted', note: 'took the job' },
  on_the_way: { label: 'Worker on the way', note: 'started travelling to the customer' },
  arrived: { label: 'Worker arrived', note: 'reached the customer location' },
  in_progress: { label: 'Work started', note: 'worker began the job' },
  completed: { label: 'Job completed', note: 'worker marked complete' },
  cancelled: { label: 'Cancelled', note: 'request cancelled by customer' },
}

function timelineEntries(r: ServiceRequestDoc) {
  const entries: { label: string; time?: string; note: string }[] = []
  entries.push({ label: 'Request created', time: r.createdAt, note: `${r.customerName ?? r.customerId} posted "${r.title}"` })
  if (r.jobUpdates && r.jobUpdates.length > 0) {
    r.jobUpdates.forEach((u) => {
      const entry = UPDATE_ENTRY[u.status]
      if (entry) entries.push({ label: entry.label, time: u.timestamp, note: u.note ? `${entry.note} · ${u.note}` : entry.note })
    })
  } else {
    if (r.acceptedAt) entries.push({ label: 'Worker accepted', time: r.acceptedAt, note: `${r.workerName ?? r.workerId} took the job` })
    if (r.completedAt) entries.push({ label: 'Job completed', time: r.completedAt, note: 'Worker marked complete' })
    if (r.ratingGiven) entries.push({ label: 'Rating submitted', note: 'Customer rated the worker' })
    if (r.status === 'cancelled') entries.push({ label: 'Cancelled', note: 'Request cancelled by customer' })
  }
  return entries
}

export default function AdminRequests() {
  const { data: requests, isLoading } = useAllRequests()
  const [status, setStatus] = useState<RequestStatus | 'all'>('all')
  const [category, setCategory] = useState<string>('all')
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<ServiceRequestDoc | null>(null)

  const filtered = useMemo(() => {
    return (requests ?? []).filter((r) => {
      if (status !== 'all' && r.status !== status) return false
      if (category !== 'all' && r.category !== category) return false
      if (q) {
        const needle = q.toLowerCase()
        return (
          r.title.toLowerCase().includes(needle) ||
          (r.customerName ?? '').toLowerCase().includes(needle) ||
          (r.workerName ?? '').toLowerCase().includes(needle)
        )
      }
      return true
    })
  }, [requests, status, category, q])

  return (
    <div className="space-y-5 animate-in">
      <div>
        <span className="eyebrow">Admin · requests</span>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">All requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {filtered.length} of {requests?.length ?? 0} requests. Click any row for the full timeline.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title, customer or worker…"
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as RequestStatus | 'all')}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s === 'all' ? 'All statuses' : s.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORY_LIST.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No requests match"
          description="Try widening the filters or clearing the search."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Request</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Customer</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Worker</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className="cursor-pointer transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <p className="max-w-64 truncate font-medium">{r.title}</p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CategoryIcon category={r.category} className="h-3.5 w-3.5" /> {r.category} · {r.id.slice(0, 8)}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{r.customerName ?? '—'}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{r.workerName ?? '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{formatRelativeTime(r.createdAt)}</td>
                  <td className="px-4 py-3"><ChevronDown className="h-4 w-4 -rotate-90 text-muted-foreground" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        {selected && <RequestTimeline r={selected} />}
      </Dialog>
    </div>
  )
}

function RequestTimeline({ r }: { r: ServiceRequestDoc }) {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{r.title}</DialogTitle>
        <DialogDescription>
          {r.category} · {r.customerName ?? 'Customer'} {r.workerId ? `→ ${r.workerName}` : '· no worker yet'}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="flex items-center gap-2"><StatusBadge status={r.status} /></div>
        {r.description && (
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</p>
            {r.description}
          </div>
        )}

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Timeline</p>
          <ol className="space-y-0 border-l border-border pl-4">
            {timelineEntries(r).map((e, i) => (
              <li key={i} className="relative pb-4">
                <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-border bg-background" />
                <p className="text-sm font-medium">{e.label}</p>
                <p className="text-xs text-muted-foreground">{e.note}</p>
                {e.time && <p className="stat-number text-[11px] text-muted-foreground">{new Date(e.time).toLocaleString()}</p>}
              </li>
            ))}
          </ol>
        </div>

        {r.customerAddress && (
          <p className="text-xs text-muted-foreground">
            Location: {r.customerAddress} · Lat {r.customerLocation?.latitude.toFixed(4)} Lng {r.customerLocation?.longitude.toFixed(4)}
          </p>
        )}
      </div>
    </DialogContent>
  )
}