import { Link, useNavigate } from 'react-router-dom'
import {
  MapPin,
  ArrowRight,
  Clock3,
  CircleCheck,
  Activity,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { useMyRequests } from '@/hooks/use-requests'
import { CATEGORY_LIST, type RequestStatus } from '@/lib/types'
import { StatusBadge } from '@/components/status-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { CategoryIcon } from '@/components/category-icon'
import { formatRelativeTime, cn } from '@/lib/utils'

function progressPercent(status: RequestStatus) {
  switch (status) {
    case 'searching': return 10
    case 'pending_worker_response': return 25
    case 'accepted': return 40
    case 'on_the_way': return 55
    case 'arrived': return 70
    case 'in_progress': return 85
    case 'completed': return 100
    default: return 0
  }
}

export default function CustomerDashboard() {
  const uid = useAuthStore((s) => s.uid)
  const name = useAuthStore((s) => s.name) ?? 'there'
  const navigate = useNavigate()
  const { data: requests, isLoading } = useMyRequests(uid)

  const active = requests?.find((r) =>
    ['searching', 'pending_worker_response', 'accepted', 'on_the_way', 'arrived', 'in_progress'].includes(r.status),
  )
  const history = requests?.filter((r) => ['completed', 'cancelled', 'rejected'].includes(r.status)) ?? []

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-in">
      <div>
        <span className="eyebrow">Customer dashboard</span>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">What’s broken, {name.split(' ')[0]}?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a category below — we’ll match you with the nearest best-rated pro.
        </p>
      </div>

      {active && (
        <Link
          to={`/customer/requests/${active.id}`}
          className="paper-card paper-card-hover flex items-center justify-between gap-4 border-l-4 border-l-primary p-5"
        >
          <div className="flex items-center gap-4">
            <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
              <Activity className="h-5 w-5 animate-pulse" />
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-primary" />
            </span>
            <div>
              <p className="font-display text-base font-semibold">{active.title}</p>
              <p className="text-xs text-muted-foreground">
                <StatusBadge status={active.status} /> · updated {formatRelativeTime(active.updatedAt ?? active.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden w-36 sm:block">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full rounded-full bg-primary transition-all duration-700',
                    active.status === 'completed' && 'bg-emerald-500',
                  )}
                  style={{ width: `${progressPercent(active.status)}%` }}
                />
              </div>
            </div>
            <Button variant="ghost" size="sm">
              Track live <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Link>
      )}

      <section>
        <h2 className="font-display text-lg font-semibold">Start a new request</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CATEGORY_LIST.map((cat) => {
            return (
              <button
                key={cat}
                onClick={() => navigate(`/customer/new?category=${encodeURIComponent(cat)}`)}
                className="paper-card paper-card-hover group flex flex-col items-start gap-3 p-4 text-left cursor-pointer"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary transition-transform group-hover:scale-105">
                  <CategoryIcon category={cat} className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold leading-tight">{cat}</span>
              </button>
            )
          })}
          <button
            onClick={() => navigate('/customer/new')}
            className="paper-card paper-card-hover flex flex-col items-start justify-center gap-2 p-4 text-left"
          >
            <span className="text-sm font-semibold text-primary">Anything else →</span>
            <span className="text-xs text-muted-foreground">Describe it your way</span>
          </button>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Recent requests</h2>
          {history.length > 0 && (
            <Link to="/customer" className="text-xs font-medium text-primary hover:underline">
              See all
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="mt-3 space-y-3">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="paper-card mt-3 flex flex-col items-center justify-center px-6 py-12 text-center">
            <CircleCheck className="mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="font-display text-base font-semibold">No past requests yet</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Your repair history will land here so you can re-book your favourite worker in a tap.
            </p>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-border/70 rounded-xl border border-border bg-card">
            {history.slice(0, 4).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-4 px-4 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  {r.photoUrls && r.photoUrls[0] && (
                    <img src={r.photoUrls[0]} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover border border-border" />
                  ) || (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                      <CategoryIcon category={r.category} className="h-4 w-4" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{r.title}</p>
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock3 className="h-3 w-3" /> {formatRelativeTime(r.createdAt)}
                      {r.workerName && (
                        <>
                          <span className="text-border">·</span> <span>{r.workerName}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={r.status} />
                  {r.status === 'completed' && !r.ratingGiven && r.paymentStatus !== 'paid' && (
                    <Button asChild size="sm" className="gap-1">
                      <Link to={`/customer/requests/${r.id}`}>Pay bill</Link>
                    </Button>
                  )}
                  {r.status === 'completed' && !r.ratingGiven && r.paymentStatus === 'paid' && (
                    <Button asChild size="sm" className="gap-1">
                      <Link to={`/customer/rate/${r.id}`}>
                        Rate <span className="hidden sm:inline">worker</span>
                      </Link>
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="geo-dots rounded-2xl border border-border bg-secondary/40 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <MapPin className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-base font-semibold">We always use your real location</p>
              <p className="text-sm text-muted-foreground">
                Requests are matched within ~25 km so your pro is genuinely nearby.
              </p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link to="/customer/new">Location is on — start a request <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </div>
  )
}