import { useMemo, useState } from 'react'
import { ScrollText, Search } from 'lucide-react'
import { useAuditLog } from '@/hooks/use-admin'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/empty-state'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

const ACTION_TONE: Record<string, string> = {
  approved_worker: 'border-sage-200 bg-sage-50 text-sage-700',
  rejected_verification: 'border-rust-300 bg-rust-50 text-rust-800',
  resolved_dispute: 'border-stone-200 bg-stone-100 text-stone-700',
  suspended_user: 'border-caramel-200 bg-caramel-50 text-caramel-800',
  unsuspend_user: 'border-sage-200 bg-sage-50 text-sage-700',
}

type ActionGroup = 'all' | 'verification' | 'disputes' | 'users' | 'requests' | 'auth'

const ACTION_GROUPS: { value: ActionGroup; label: string; match: (action: string) => boolean }[] = [
  { value: 'all', label: 'All actions', match: () => true },
  { value: 'verification', label: 'Verification', match: (a) => a.includes('verification') },
  { value: 'disputes', label: 'Disputes', match: (a) => a.includes('dispute') },
  { value: 'users', label: 'Users', match: (a) => a.includes('user_') || a === 'signup' },
  { value: 'requests', label: 'Requests', match: (a) => a.includes('request') || a === 'pay_request' || a === 'rate_worker' },
  { value: 'auth', label: 'Auth', match: (a) => a === 'login' || a === 'signup' || a === 'password_reset' },
]

export default function AdminAuditLog() {
  const { data: logs, isLoading } = useAuditLog()
  const [q, setQ] = useState('')
  const [group, setGroup] = useState<ActionGroup>('all')

  const filtered = useMemo(() => {
    const list = (logs ?? []).filter((l) => ACTION_GROUPS.find((g) => g.value === group)!.match(l.action))
    if (!q) return list
    const needle = q.toLowerCase()
    return list.filter(
      (l) =>
        l.action.toLowerCase().includes(needle) ||
        l.actorId.toLowerCase().includes(needle) ||
        l.targetId.toLowerCase().includes(needle),
    )
  }, [logs, q, group])

  return (
    <div className="mx-auto max-w-3xl space-y-5 animate-in">
      <div>
        <span className="eyebrow">Admin · audit log</span>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Audit trail</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Read-only record of every admin action. Written automatically when you approve, reject, resolve or suspend.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by action, actor or target…" className="pl-9" />
        </div>
        <Select value={group} onValueChange={(v) => setGroup(v as ActionGroup)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACTION_GROUPS.map((g) => (
              <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
