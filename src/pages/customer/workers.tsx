import { useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Star, Loader2, Search, ArrowLeft, UserRound, ArrowRight, WifiOff, ShieldCheck, MapPin, Zap } from 'lucide-react'
import { useAllWorkers } from '@/hooks/use-workers'
import { useMyRequests } from '@/hooks/use-requests'
import { useAuthStore } from '@/stores/auth'
import { requestWorker } from '@/services/requests.service'
import { Stars } from '@/components/stars'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { CategoryIcon } from '@/components/category-icon'
import { MapView, type MapMarker } from '@/components/map-view'

import { toastError, toastSuccess } from '@/hooks/use-toast'
import { haversine } from '@/lib/geo'
import {
  getNearbyLocations,
  MADURAI_CENTER,
} from '@/lib/madurai-locations'
import { cn } from '@/lib/utils'
import type { WorkerProfileDoc } from '@/lib/types'

const SORTS = [
  ['rating', Star, 'Rating'],
  ['nearby', MapPin, 'Nearby'],
  ['fast', Zap, 'Fastest'],
] as const

function TopRatedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-2 py-0.5 text-[11px] font-bold text-amber-950 shadow-[0_2px_8px_-2px_rgba(245,158,11,0.6)] animate-badge-bounce">
      <Star className="h-3 w-3 fill-amber-950 text-amber-950" /> Top Rated
    </span>
  )
}

export default function CustomerWorkers() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const requestId = params.get('request')
  const uid = useAuthStore((s) => s.uid)!
  const { data: requests } = useMyRequests(uid)
  const { data: allWorkers, isLoading, error } = useAllWorkers()

  const request = useMemo(() => requests?.find((r) => r.id === requestId) ?? null, [requests, requestId])

  const excludeIds = useMemo(() => new Set(request?.rejectedBy ?? []), [request?.rejectedBy])
  const category = request?.category?.toLowerCase() ?? null

  const [sortBy, setSortBy] = useState<'rating' | 'nearby' | 'fast'>('rating')
  const customerLocation = request?.customerLocation ?? null

  const workers = useMemo(() => {
    if (!allWorkers) return null
    let list = allWorkers.filter(
      (w) => !excludeIds.has(w.userId) && (!category || w.categorySkills.some((s) => s.toLowerCase() === category)),
    )
    if (sortBy === 'nearby' && customerLocation) {
      // Nearby shows the workers whose areas are inside the 10 closest
      // pincodes/locations to the customer, then orders them by distance.
      const nearbyPins = new Set(getNearbyLocations(request?.customerPincode ?? request?.customerArea ?? '', 10).map((n) => n.location.pincode))
      if (nearbyPins.size > 0) {
        const inNearby = list.filter((w) => w.pincode && nearbyPins.has(w.pincode))
        if (inNearby.length > 0) list = inNearby
      }
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'nearby' && customerLocation) {
        return haversine(customerLocation, a.g.geopoint) - haversine(customerLocation, b.g.geopoint)
      }
      if (sortBy === 'fast') {
        return (a.avgResponseMin ?? 1e9) - (b.avgResponseMin ?? 1e9)
      }
      return b.rating - a.rating
    })
  }, [allWorkers, excludeIds, category, sortBy, customerLocation, request?.customerPincode, request?.customerArea])

  const [busyWorker, setBusyWorker] = useState<string | null>(null)
  const [activeWorkerId, setActiveWorkerId] = useState<string | null>(null)
  const workerCardRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const mapMarkers = useMemo<MapMarker[]>(
    () =>
      (workers ?? [])
        .filter((w) => Number.isFinite(w.g.geopoint.latitude) && Number.isFinite(w.g.geopoint.longitude))
        .map((w) => ({
          id: w.userId,
          lat: w.g.geopoint.latitude,
          lng: w.g.geopoint.longitude,
          label: w.name.split(' ')[0],
          color: w.rating >= 4.8 ? '#d97706' : '#2f6f4f',
          kind: 'worker' as const,
          category: w.categorySkills[0],
        })),
    [workers],
  )

  const mapCenter = useMemo(() => {
    if (customerLocation) {
      return { lat: customerLocation.latitude, lng: customerLocation.longitude }
    }
    const m = mapMarkers[0]
    return m ? { lat: m.lat, lng: m.lng } : { lat: MADURAI_CENTER.lat, lng: MADURAI_CENTER.lng }
  }, [customerLocation, mapMarkers])

  function handleMarkerSelect(workerId: string) {
    setActiveWorkerId(workerId)
    workerCardRefs.current[workerId]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  async function handleRequestWorker(worker: WorkerProfileDoc) {
    if (!requestId) return
    setBusyWorker(worker.userId)
    try {
      const ok = await requestWorker(requestId, worker.userId, worker.name)
      if (ok) {
        toastSuccess('Requested!', `${worker.name} has been notified. We'll update you live.`)
        navigate(`/customer/requests/${requestId}`, { replace: true })
      }
    } catch (err) {
      toastError('Failed', err instanceof Error ? err.message : 'Try again in a moment')
      setBusyWorker(null)
    }
  }

  if (!requestId || !request) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="font-display text-xl font-semibold">No active request</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Start a new repair request first — we'll then show you the best-rated workers.
        </p>
        <Button onClick={() => navigate('/customer/new')}>Start a request</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 animate-in">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="eyebrow">Choose a worker</span>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">Find workers based on rating</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Top-rated professionals for {request.title} — tap one and they get a live alert to accept or decline.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/customer/new')}>
            <ArrowLeft className="h-4 w-4" /> Edit request
          </Button>
          {request && (
            <Button variant="ghost" size="sm" onClick={() => navigate(`/customer/requests/${requestId}`)}>
              <StatusBadge status={request.status} />
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 py-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-4">
                <div className="skeleton-shimmer h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <div className="skeleton-shimmer h-4 w-40 rounded-md" />
                  <div className="skeleton-shimmer h-3 w-24 rounded-md" />
                </div>
              </div>
              <div className="skeleton-shimmer h-9 w-24 rounded-lg" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="paper-card flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Search className="h-10 w-10 text-muted-foreground/30" />
          <p className="font-display text-lg font-semibold">Could not load workers</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Something went wrong — try again in a moment.
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      ) : !workers || workers.length === 0 ? (
        <div className="paper-card flex flex-col items-center gap-3 px-6 py-16 text-center">
          <UserRound className="h-10 w-10 text-muted-foreground/30" />
          <p className="font-display text-lg font-semibold">No available workers right now</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            No matching professionals are registered yet. Check back soon — new workers sign up regularly.
          </p>
          <Button onClick={() => window.location.reload()}>Refresh list</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {mapMarkers.length > 0 && (
            <MapView
              markers={mapMarkers}
              center={mapCenter}
              height={240}
              activeId={activeWorkerId ?? undefined}
              onMarkerSelect={handleMarkerSelect}
              className="shadow-sm"
            />
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              {workers.length} professional{workers.length === 1 ? '' : 's'} found —{' '}
              {sortBy === 'nearby'
                ? 'nearest first (top 10 nearby areas)'
                : sortBy === 'fast'
                  ? 'fastest response time'
                  : 'sorted by rating (default)'}
            </p>
            <div className="relative flex items-center rounded-lg border border-border bg-muted/60 p-0.5">
              <span
                aria-hidden
                className="absolute bottom-0.5 left-0.5 top-0.5 rounded-md bg-background shadow-sm transition-transform duration-300 ease-out"
                style={{
                  width: 'calc((100% - 4px) / 3)',
                  transform: `translateX(${SORTS.findIndex(([k]) => k === sortBy) * 100}%)`,
                }}
              />
              {SORTS.map(([key, Icon, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSortBy(key)}
                  className={`relative z-10 inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                    sortBy === key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon
                    className={`h-3 w-3 ${sortBy === key ? 'text-primary' : ''}`}
                  />
                  {label}
                  {key === 'rating' && sortBy === 'rating' && (
                    <span className="font-normal text-muted-foreground">· default</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {workers.map((worker, i) => (
            <div
              key={worker.userId}
              ref={(el) => {
                workerCardRefs.current[worker.userId] = el
              }}
              onMouseEnter={() => setActiveWorkerId(worker.userId)}
              className={cn(
                'paper-card paper-card-hover flex flex-col gap-4 p-4 transition-all duration-200 sm:flex-row sm:items-center sm:justify-between animate-stagger-in cursor-pointer',
                worker.rating >= 4.8 && 'glow-amber',
                activeWorkerId === worker.userId && 'ring-2 ring-primary/60 shadow-lg',
              )}
              style={{ animationDelay: `${i * 55}ms` }}
            >
              <div className="flex items-start gap-4">
                <span className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground',
                  worker.rating >= 4.8 && 'ring-2 ring-amber-300/70 animate-pulse-glow',
                )}>
                  <span className="text-sm font-semibold">{worker.name.split(' ').map((p) => p[0]).join('')}</span>
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-base font-semibold">{worker.name}</h3>
                    {worker.rating >= 4.8 && <TopRatedBadge />}
                    {worker.verificationStatus === 'approved' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        <ShieldCheck className="h-3 w-3" /> Verified
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CategoryIcon category={worker.categorySkills[0] ?? ''} className="h-3.5 w-3.5" />
                    {worker.categorySkills.join(' · ')}
                  </p>
                  {worker.area && worker.pincode && (
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 text-primary/70" />
                      {worker.area}
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground/80">
                        {worker.pincode}
                      </span>
                      {request?.customerPincode === worker.pincode && (
                        <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                          same pincode
                        </span>
                      )}
                    </p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Stars value={worker.rating} size={14} />
                      <span className={worker.rating >= 4.8 ? 'text-gradient-gold' : ''}>{worker.rating.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({worker.ratingCount})</span>
                    </span>
                    {worker.avgResponseMin !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        Avg ~{worker.avgResponseMin} min response
                      </span>
                    )}
                    {!worker.isOnline && (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <WifiOff className="h-3 w-3" />
                        {worker.availableSlots && worker.availableSlots.length > 0 ? (
                          <>Available {worker.availableSlots[0]!.day} {formatTime(worker.availableSlots[0]!.from)}–{formatTime(worker.availableSlots[0]!.to)}</>
                        ) : (
                          'Offline'
                        )}
                      </span>
                    )}
                    {worker.isOnline && (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" /> Online
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Button
                className="group shrink-0 gap-2 px-5 sm:self-center"
                disabled={busyWorker !== null}
                onClick={() => handleRequestWorker(worker)}
              >
                {busyWorker === worker.userId ? (
                  <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Requesting…</span>
                ) : (
                  <>Request <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" /></>
                )}
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
        <p>
          Sort by rating, how nearby they are, or how fast they typically respond. When a worker is offline, their displayed availability window
          tells you when they're back — you can still request them in the meantime.
        </p>
      </div>
    </div>
  )
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)!
  const ampm = h! >= 12 ? 'PM' : 'AM'
  const hour = h! % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}
