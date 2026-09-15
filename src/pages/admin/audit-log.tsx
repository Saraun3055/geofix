import { useMemo, useState } from 'react'
import { ScrollText, Search } from 'lucide-react'
import { useAuditLog } from '@/hooks/use-admin'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/empty-state'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

const ACTION_TONE: Record<string, string> = {
  approved_worker: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  rejected_verification: 'border-rose-200 bg-rose-50 text-rose-700',
  resolved_dispute: 'border-blue-200 bg-blue-50 text-blue-700',
  suspended_user: 'border-amber-200 bg-amber-50 text-amber-800',
  unsuspend_user: 'border-emerald-200 bg-emerald-50 text-emerald-700',
}

export default function AdminAuditLog() {
  const { data: logs, isLoading } = useAuditLog()
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    if (!q) return logs ?? []
    const needle = q.toLowerCase()
    return (logs ?? []).filter(
      (l) =>
        l.action.toLowerCase().includes(needle) ||
        l.actorId.toLowerCase().includes(needle) ||
        l.targetId.toLowerCase().includes(needle),
    )
  }, [logs, q])

  return (
    <div className="mx-auto max-w-3xl space-y-5 animate-in">
      <div>
        <span className="eyebrow">Admin · audit log</span>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Audit trail</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Read-only record of every admin action. Written automatically when you approve, reject, resolve or suspend.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by action, actor or target…" className="pl-9" />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No log entries"
          description="Actions taken in the admin portal will appear here in real time."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <ul className="divide-y divide-border/60">
            {filtered.map((l) => (
              <li key={l.id} className="flex items-start gap-3 px-4 py-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={cn(ACTION_TONE[l.action] ?? '')}>{l.action.replace(/_/g, ' ')}</Badge>
                    <span className="text-xs text-muted-foreground">
                      by <span className="font-mono font-medium text-foreground">{l.actorId}</span> ({l.actorRole})
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Target: <span className="font-mono">{l.targetId}</span>
                  </p>
                </div>
                <span className="stat-number shrink-0 text-xs text-muted-foreground">{formatRelativeTime(l.timestamp)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}