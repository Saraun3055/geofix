import { useMemo, useState } from 'react'
import { Scale, Search } from 'lucide-react'
import { useDisputes } from '@/hooks/use-admin'
import { resolveDispute } from '@/services/admin.service'
import { useAuthStore } from '@/stores/auth'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/empty-state'
import { formatRelativeTime } from '@/lib/utils'
import type { DisputeDoc } from '@/lib/types'

function DisputeRow({ d, onResolve }: { d: DisputeDoc; onResolve: (d: DisputeDoc) => void }) {
  return (
    <div className="paper-card paper-card-hover p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-semibold">{d.reason}</h3>
            <Badge variant={d.status === 'open' ? 'warning' : 'success'}>
              {d.status === 'open' ? 'Open' : 'Resolved'}
            </Badge>
            <Badge variant="secondary">raised by {d.raisedBy}</Badge>
          </div>
          <p className="stat-number mt-1 text-xs text-muted-foreground">
            Req {d.requestId?.slice(0, 10)} · {formatRelativeTime(d.createdAt)}
          </p>
        </div>
        {d.status === 'open' && (
          <Button size="sm" onClick={() => onResolve(d)}>Resolve with note</Button>
        )}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{d.description}</p>
      {d.status === 'resolved' && d.resolutionNote && (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <span className="font-semibold">Resolution: </span>
          {d.resolutionNote}
        </div>
      )}
    </div>
  )
}

export default function AdminDisputes() {
  const admin = useAuthStore((s) => s.uid) ?? 'admin'
  const [tab, setTab] = useState<'open' | 'resolved' | ''>('open')
  const [q, setQ] = useState('')
  const [resolveTarget, setResolveTarget] = useState<DisputeDoc | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const openQuery = useDisputes(tab)
  const allQuery = useDisputes('')

  const filtered = useMemo(() => {
    const list = tab ? openQuery.data ?? [] : allQuery.data ?? []
    if (!q) return list
    const needle = q.toLowerCase()
    return list.filter(
      (d) => d.reason.toLowerCase().includes(needle) || d.description.toLowerCase().includes(needle) || d.requestId.includes(needle),
    )
  }, [tab, q, openQuery.data, allQuery.data])

  async function doResolve() {
    if (!resolveTarget || !note.trim()) return
    setBusy(true)
    await resolveDispute(resolveTarget.id, note.trim(), admin)
    setBusy(false)
    setResolveTarget(null)
    setNote('')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 animate-in">
      <div>
        <span className="eyebrow">Admin · disputes</span>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Dispute resolution</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Issues raised by customers or workers against a request. Track and resolve them here.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="">All</TabsTrigger>
        </TabsList>

        <div className="relative mt-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search disputes…" className="pl-9" />
        </div>

        <TabsContent value={tab} className="mt-4">
          {(tab ? openQuery.isLoading : allQuery.isLoading) ? (
            <div className="space-y-3">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Scale} title="Nothing here" description="No disputes match this filter." />
          ) : (
            <div className="space-y-3">
              {filtered.map((d) => (
                <DisputeRow key={d.id} d={d} onResolve={setResolveTarget} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {resolveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-lg animate-in">
            <h2 className="font-display text-lg font-semibold">Resolve dispute</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              For request <span className="font-mono">{resolveTarget.requestId?.slice(0, 12)}</span> · {resolveTarget.reason}
            </p>
            <Textarea
              className="mt-4"
              rows={4}
              placeholder="Add a resolution note for the audit record…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setResolveTarget(null)}>Cancel</Button>
              <Button onClick={doResolve} disabled={busy || !note.trim()}>
                {busy ? 'Saving…' : 'Resolve dispute'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}