import { useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Activity, Timer, Star, Radio, Wrench } from 'lucide-react'
import { useAllRequests } from '@/hooks/use-requests'
import { useAllWorkers } from '@/hooks/use-workers'
import { useActiveRequestsStats } from '@/hooks/use-admin'
import { MapView, type MapMarker } from '@/components/map-view'
import { StatusBadge } from '@/components/status-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { timeAgoShort } from '@/lib/utils'

const CHART_COLORS = ['#b7512e', '#f2a23c', '#9a6a10', '#6d8b3f', '#b3382c', '#40332b', '#7c6b5e', '#c9a26b']

const ACTIVE_STATUSES = ['searching', 'pending_worker_response', 'accepted', 'on_the_way', 'arrived', 'in_progress']

function StatBlock({
  label,
  value,
  sub,
  icon: Icon,
  mono = true,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ComponentType<{ className?: string }>
  mono?: boolean
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3.5">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className={cn('stat-number mt-2 text-3xl font-bold', !mono && 'font-display')}>{value}</p>
      {sub && <p className="stat-number mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

export default function AdminOverview() {
  const { data: requests, isLoading } = useAllRequests()
  const { data: workers } = useAllWorkers()
  const stats = useActiveRequestsStats()

  const metrics = useMemo(() => {
    const completed = requests?.filter((r) => r.status === 'completed') ?? []
    const avgRating = workers && workers.length > 0
      ? workers.reduce((a, w) => a + w.rating, 0) / workers.length
      : 0
    const avgResponse = workers && workers.length > 0
      ? workers.reduce((a, w) => a + (w.avgResponseMin ?? 0), 0) / workers.length
      : 0
    const online = workers?.filter((w) => w.isOnline).length ?? 0
    return { avgRating, avgResponse, online, completedCount: completed.length }
  }, [workers, requests])

  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    requests?.forEach((r) => map.set(r.category, (map.get(r.category) ?? 0) + 1))
    return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [requests])

  const byDay = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(Date.now() - (13 - i) * 86400000)
      return { date: d, key: d.toISOString().slice(0, 10), label: d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' }) }
    })
    const counts = new Map(days.map((d) => [d.key, 0]))
    requests?.forEach((r) => {
      const key = new Date(r.createdAt).toISOString().slice(0, 10)
      if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1)
    })
    return days.map((d) => ({ label: d.label, count: counts.get(d.key) ?? 0 }))
  }, [requests])

  const statusPie = useMemo(() => {
    const map = new Map<string, number>()
    requests?.forEach((r) => map.set(r.status, (map.get(r.status) ?? 0) + 1))
    return [...map.entries()].map(([name, value]) => ({ name, value }))
  }, [requests])

  const mapMarkers = useMemo(() => {
    const markers: MapMarker[] = []
    requests?.filter((r) => ACTIVE_STATUSES.includes(r.status)).forEach((r) => {
      if (!r.customerLocation) return
      markers.push({
        id: `req-${r.id}`,
        lat: r.customerLocation.latitude,
        lng: r.customerLocation.longitude,
        label: r.category,
        kind: 'request',
        color:
          r.status === 'accepted' || r.status === 'on_the_way' || r.status === 'arrived' || r.status === 'in_progress'
            ? '#2f6f4f'
            : r.status === 'pending_worker_response'
              ? '#c9a26b'
              : '#b7512e',
      })
    })
    workers?.filter((w) => w.isOnline).forEach((w, i) => {
      markers.push({
        id: `wkr-${w.userId}`,
        lat: w.g.geopoint.latitude,
        lng: w.g.geopoint.longitude,
        label: w.name.split(' ')[0],
        kind: 'worker',
        category: w.categorySkills[0],
        color: '#2f6f4f',
      })
      void i
    })
    return markers
  }, [requests, workers])

  const center = mapMarkers[0]
    ? { lat: mapMarkers[0].lat, lng: mapMarkers[0].lng }
    : { lat: 28.6139, lng: 77.209 }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="eyebrow">Operations overview</span>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Live operations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything updates live from the same backend the mobile app writes to.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <span className={cn('h-2 w-2 rounded-full', stats.data && stats.data.total > 0 ? 'bg-emerald-500' : 'bg-amber-400')} />
          {stats.data && stats.data.total > 0 ? `${stats.data.total} active fleets` : 'Idle — no active requests'}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatBlock icon={Activity} label="Active requests" value={String(stats.data?.total ?? 0)} sub={`${stats.data?.searching ?? 0} searching · ${stats.data?.accepted ?? 0} in progress`} />
        <StatBlock icon={Timer} label="Avg response" value={metrics.avgResponse ? `${metrics.avgResponse.toFixed(1)}m` : '—'} sub="worker accept time" />
        <StatBlock icon={Star} label="Avg rating" value={metrics.avgRating ? metrics.avgRating.toFixed(2) : '—'} sub={`${workers?.length ?? 0} workers total`} />
        <StatBlock icon={Wrench} label="Jobs completed" value={String(metrics.completedCount)} sub={`${metrics.online} workers online now`} />
      </div>

      {/* Live map */}
      <div className="paper-card p-0">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-primary" />
            <h2 className="font-display text-base font-semibold">Live map</h2>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#b7512e]" /> Request</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#2f6f4f]" /> Online worker</span>
          </div>
        </div>
        <MapView markers={mapMarkers} center={center} zoom={11} height={360} className="rounded-t-none rounded-b-xl border-0" />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="paper-card p-5 lg:col-span-2">
          <h3 className="font-display text-base font-semibold">Requests per day</h3>
          <p className="mb-4 mt-0.5 text-xs text-muted-foreground">Last 14 days</p>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={byDay} margin={{ top: 5, right: 10, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="dayFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#b7512e" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#b7512e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5dac8" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e5dac8', fontFamily: 'JetBrains Mono, monospace' }}
                />
                <Area type="monotone" dataKey="count" stroke="#b7512e" strokeWidth={2} fill="url(#dayFill)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="paper-card p-5">
          <h3 className="font-display text-base font-semibold">By category</h3>
          <p className="mb-4 mt-0.5 text-xs text-muted-foreground">Share of all requests</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byCategory} layout="vertical" margin={{ top: 0, right: 10, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5dac8" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={74} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e5dac8', fontFamily: 'JetBrains Mono, monospace' }}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {byCategory.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status + active list */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="paper-card p-5">
          <h3 className="font-display text-base font-semibold">Request states</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusPie} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={2}>
                {statusPie.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e5dac8', fontFamily: 'JetBrains Mono, monospace' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
            {statusPie.map((s, i) => (
              <span key={s.name} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                {s.name.replace(/_/g, ' ')} · {s.value}
              </span>
            ))}
          </div>
        </div>

        <div className="paper-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold">Active requests</h3>
            <span className="text-[11px] text-muted-foreground">live</span>
          </div>
          <div className="mt-3 space-y-2 overflow-x-auto">
            {(requests ?? [])
              .filter((r) => ACTIVE_STATUSES.includes(r.status))
              .slice(0, 6)
              .map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 px-3 py-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{r.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {r.customerName ?? 'Customer'} · {r.category} · {timeAgoShort(r.createdAt)} ago
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}