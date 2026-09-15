import { useMemo, useState } from 'react'
import { Users, Search, UserX, RotateCcw, ShieldCheck } from 'lucide-react'
import { useAllUsers } from '@/hooks/use-admin'
import { suspendUser, unsuspendUser } from '@/services/admin.service'
import { useAuthStore } from '@/stores/auth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/empty-state'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { UserDoc } from '@/lib/types'

export default function AdminUsers() {
  const admin = useAuthStore((s) => s.uid) ?? 'admin'
  const { data: users, isLoading } = useAllUsers()
  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'customer' | 'worker'>('all')

  const filtered = useMemo(() => {
    return (users ?? []).filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      if (q) {
        const needle = q.toLowerCase()
        return (u.name ?? '').toLowerCase().includes(needle) || (u.email ?? u.phone ?? '').toLowerCase().includes(needle)
      }
      return true
    })
  }, [users, q, roleFilter])

  const onlineWorkers = users?.filter((u) => u.role === 'worker').length ?? 0

  return (
    <div className="space-y-5 animate-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="eyebrow">Admin · users</span>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">User management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {users?.length ?? 0} accounts · {onlineWorkers} workers on the platform
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1 text-xs font-medium">
          {(['all', 'customer', 'worker'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={cn(
                'rounded-md px-3 py-1.5 transition-colors cursor-pointer',
                roleFilter === r ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {r === 'all' ? 'All' : r + 's'}
            </button>
          ))}
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, email or phone…" className="pl-9" />
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="Try a different search or filter." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((u) => (
            <UserRow key={u.uid} user={u} admin={admin} />
          ))}
        </div>
      )}
    </div>
  )
}

function UserRow({ user, admin }: { user: UserDoc; admin: string }) {
  const [busy, setBusy] = useState(false)

  async function toggle() {
    setBusy(true)
    if (user.suspended) await unsuspendUser(user.uid)
    else await suspendUser(user.uid, admin)
    setBusy(false)
  }

  return (
    <div className="paper-card flex items-center justify-between gap-3 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar>
          <AvatarFallback className={cn(user.role === 'worker' && 'bg-amber-100 text-amber-800')}>
            {user.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
            {user.name}
            {user.role === 'worker' && <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />}
            {user.suspended && <UserX className="h-3.5 w-3.5 text-destructive" />}
          </p>
          <p className="truncate text-xs text-muted-foreground">{user.email ?? user.phone ?? user.uid}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Joined {formatRelativeTime(user.createdAt)}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <Badge variant={user.role === 'worker' ? 'warning' : 'secondary'}>{user.role}</Badge>
        <Button
          size="sm"
          variant={user.suspended ? 'outline' : 'ghost'}
          className={user.suspended ? '' : 'text-destructive'}
          onClick={toggle}
          disabled={busy}
        >
          {user.suspended ? (
            <><RotateCcw className="h-3.5 w-3.5" /> Unsuspend</>
          ) : (
            <><UserX className="h-3.5 w-3.5" /> Suspend</>
          )}
        </Button>
      </div>
    </div>
  )
}