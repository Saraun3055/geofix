import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Loader2,
  PhoneCall,
  Check,
  X,
  RefreshCw,
  ArrowRight,
  Banknote,
  Wallet,
  ShieldAlert,
  Receipt,
  Navigation,
  MapPin,
  Hammer,
  History,
  Image as ImageIcon,
} from 'lucide-react'
import { useRequestLive } from '@/hooks/use-requests'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { WhatsAppHandoff } from '@/components/whatsapp'
import { CategoryIcon } from '@/components/category-icon'
import type { RequestStatus, PaymentMethod } from '@/lib/types'
import { cancelRequest, payForRequest } from '@/services/requests.service'
import { toastError, toastSuccess } from '@/hooks/use-toast'
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
import { cn } from '@/lib/utils'

const TIMELINE_STEPS: { key: RequestStatus; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'searching', label: 'Searching', icon: RefreshCw },
  { key: 'pending_worker_response', label: 'Notified', icon: PhoneCall },
  { key: 'accepted', label: 'Accepted', icon: Check },
  { key: 'on_the_way', label: 'On the way', icon: Navigation },
  { key: 'arrived', label: 'Arrived', icon: MapPin },
  { key: 'in_progress', label: 'In progress', icon: Hammer },
  { key: 'completed', label: 'Job complete', icon: Check },
]

function timelineIndex(status: RequestStatus) {
  if (status === 'completed') return TIMELINE_STEPS.length
  if (status === 'cancelled') return -1
  return TIMELINE_STEPS.findIndex((s) => s.key === status)
}

const ACTIVE_STATUSES: RequestStatus[] = ['accepted', 'on_the_way', 'arrived', 'in_progress']

const ACTIVE_MESSAGE: Record<RequestStatus, { title: string; body: string }> = {
  accepted: {
    title: 'Your request has been accepted!',
    body: '{worker} is getting ready. Open WhatsApp to coordinate.',
  },
  on_the_way: {
    title: '{worker} is on the way',
    body: 'Your worker has started travelling to your location.',
  },
  arrived: {
    title: '{worker} has arrived',
    body: 'Your worker reached your location and is about to start.',
  },
  in_progress: {
    title: '{worker} is working on it now',
    body: 'Work has started — sit tight, they’ll send a bill when done.',
  },
  searching: { title: '', body: '' },
  pending_worker_response: { title: '', body: '' },
  rejected: { title: '', body: '' },
  completed: { title: '', body: '' },
  cancelled: { title: '', body: '' },
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

const PAY_METHODS: { key: PaymentMethod; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'cash', label: 'Cash', icon: Banknote },
  { key: 'upi', label: 'UPI', icon: Wallet },
]

function inr(n: number) {
  return `₹${(n ?? 0).toLocaleString('en-IN')}`
}

export default function CustomerLiveStatus() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [paying, setPaying] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const { data: request, isLoading } = useRequestLive(id)
  const status = request?.status

  const activeIdx = status ? timelineIndex(status) : -1

  async function handlePay() {
    if (!request) return
    setPaying(true)
    const ok = await payForRequest(request.id, method)
    setPaying(false)
    if (ok) {
      toastSuccess('Payment received', `Bill paid via ${method.toUpperCase()}. You can now rate the worker.`)
    } else {
      toastError('Payment failed', 'We could not confirm your payment. Please try again.')
    }
  }

  async function handleCancel() {
    if (!request || cancelling) return
    setCancelling(true)
    const ok = await cancelRequest(request.id)
    setCancelling(false)
    setCancelOpen(false)
    if (ok) {
      toastSuccess('Booking cancelled', 'The worker has been notified and your request is now closed.')
    } else {
      toastError('Cancel failed', 'We could not cancel this booking. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size={28} className="text-primary" />
      </div>
    )
  }

  if (!request) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="font-display text-xl font-semibold">Request not found</p>
        <Button onClick={() => navigate('/customer/dashboard')}>Back to dashboard</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/customer/dashboard')}
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </button>
        <StatusBadge status={status!} />
      </div>

      <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight">
        <CategoryIcon category={request.category} className="h-5 w-5 text-primary" />
        {request.title}
      </h1>
      {request.description && (
        <p className="text-sm text-muted-foreground">{request.description}</p>
      )}

      {request.photoUrls && request.photoUrls.length > 0 && (
        <div className="paper-card p-4">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <ImageIcon className="h-3.5 w-3.5" /> Photos from your request
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {request.photoUrls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-border">
                <img src={url} alt={`Photo ${i + 1}`} className="h-24 w-full object-cover transition-transform hover:scale-105 sm:h-28" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="paper-card p-5">
        <div className="relative flex items-start justify-between">
          <div className="absolute top-3 left-0 right-0 h-0.5 bg-border" />
          <div
            className="absolute top-3 left-0 h-0.5 bg-primary shadow-[0_0_8px] shadow-primary/50 transition-all duration-700 ease-out"
            style={{ width: `${Math.min(100, (activeIdx / (TIMELINE_STEPS.length - 1)) * 100)}%` }}
          />
          {TIMELINE_STEPS.map((step, i) => {
            const reached = i <= activeIdx && activeIdx >= 0
            const isCurrent = i === activeIdx
            const Icon = step.icon
            return (
              <div key={step.key} className="relative z-10 flex flex-col items-center gap-2">
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all duration-300',
                    reached
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isCurrent
                        ? 'border-primary bg-primary text-primary-foreground ring-4 ring-primary/20 animate-pulse-glow'
                        : 'border-border bg-background text-muted-foreground',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className={cn('text-[11px] font-medium', reached ? 'text-foreground' : 'text-muted-foreground')}>
                  {step.label}
                </span>
              </div>
            )
          })}
          {status === 'cancelled' && (
            <div className="relative z-10 flex flex-col items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-destructive bg-destructive text-destructive-foreground shadow-[0_0_10px] shadow-destructive/40">
                <X className="h-3.5 w-3.5" />
              </span>
              <span className="text-[11px] font-medium text-destructive">Cancelled</span>
            </div>
          )}
        </div>
      </div>

      {/* Rejected state — link back to workers */}
      {status === 'searching' && request.rejectedBy && request.rejectedBy.length > 0 && (
        <div className="rounded-xl border border-dashed border-border bg-muted/40 px-5 py-4 text-center">
          <p className="text-sm font-medium">
            That worker declined your request. Tap below to choose the next-best-rated professional.
          </p>
          <Button className="mt-3 gap-2" onClick={() => navigate('/customer/new/workers?request=' + request.id)}>
            Browse next worker <ArrowRight className="h-4 w-4" />
          </Button>
          <button
            onClick={() => setCancelOpen(true)}
            className="mt-3 text-xs font-medium text-muted-foreground hover:text-destructive cursor-pointer"
          >
            Cancel request instead
          </button>
        </div>
      )}

{/* Pending / Waiting */}
      {status === 'searching' && (!request.rejectedBy || request.rejectedBy.length === 0) && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <Loader2 className="h-7 w-7 animate-spin text-amber-700" />
          </div>
          <p className="font-display text-lg font-semibold">We're searching for your worker</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Your request is visible to nearby verified workers. When one accepts, this page updates instantly.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button className="gap-2" onClick={() => navigate(`/customer/new/workers?request=${request.id}`)}>
              Find workers based on rating <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCancelOpen(true)}>
              Cancel request
            </Button>
          </div>
        </div>
      )}

      {status === 'pending_worker_response' && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
            <PhoneCall className="h-7 w-7 animate-pulse text-blue-700" />
          </div>
          <p className="font-display text-lg font-semibold">{request.workerName ?? 'The worker'} has been notified</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Waiting for them to accept or decline. Your screen updates live — no refresh needed.
          </p>
          <Button variant="ghost" size="sm" onClick={() => setCancelOpen(true)}>
            Cancel booking
          </Button>
        </div>
      )}

      {/* Active job — live progress + WhatsApp handoff + update log */}
      {ACTIVE_STATUSES.includes(status!) && request.workerId && (
        <div className="space-y-5 animate-in">
          <div
            className={cn(
              'rounded-xl border px-6 py-5 text-center shadow-[0_16px_40px_-24px_rgba(0,0,0,0.35)]',
              status === 'accepted' && 'border-emerald-200 bg-emerald-50 shadow-emerald-500/20',
              status === 'on_the_way' && 'border-sky-200 bg-sky-50 shadow-sky-500/20',
              status === 'arrived' && 'border-indigo-200 bg-indigo-50 shadow-indigo-500/20',
              status === 'in_progress' && 'border-amber-200 bg-amber-50 shadow-amber-500/25',
            )}
          >
            <div
              className={cn(
                'mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full animate-pulse-glow',
                status === 'accepted' && 'bg-emerald-200 text-emerald-800',
                status === 'on_the_way' && 'bg-sky-200 text-sky-800',
                status === 'arrived' && 'bg-indigo-200 text-indigo-800',
                status === 'in_progress' && 'bg-amber-200 text-amber-800',
              )}
            >
              {status === 'accepted' && <Check className="h-6 w-6" />}
              {status === 'on_the_way' && <Navigation className="h-6 w-6" />}
              {status === 'arrived' && <MapPin className="h-6 w-6" />}
              {status === 'in_progress' && <Hammer className="h-6 w-6" />}
            </div>
            <p className="font-display text-lg font-semibold">
              {(ACTIVE_MESSAGE[status!].title as string).replace('{worker}', request.workerName ?? 'your worker')}
            </p>
            <p className="mt-1 text-sm text-foreground/70">
              {(ACTIVE_MESSAGE[status!].body as string).replace('{worker}', request.workerName ?? 'your worker')}
            </p>
          </div>

          <WhatsAppHandoff
            phone={request.whatsappNumber ?? ''}
            workerName={request.workerName}
            requestTitle={request.title}
            category={request.category}
            address={request.customerAddress ?? ''}
            lat={request.customerLocation.latitude}
            lng={request.customerLocation.longitude}
          />

          {request.jobUpdates && request.jobUpdates.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <History className="h-3.5 w-3.5" /> Live update timeline
              </p>
              <ol className="space-y-2.5">
                {request.jobUpdates.map((u, i) => (
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

          <div className="rounded-xl border border-dashed border-border bg-muted/40 px-5 py-4 text-center">
            <p className="text-sm text-muted-foreground">
              Once the job is done, <strong>{request.workerName}</strong> will send you a bill to review here.
            </p>
          </div>

          <button
            onClick={() => setCancelOpen(true)}
            className="mx-auto flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-destructive cursor-pointer"
          >
            <X className="h-3.5 w-3.5" /> Cancel this booking
          </button>
        </div>
      )}

      {/* Completed — bill + payment */}
      {status === 'completed' && request.bill && request.paymentStatus !== 'paid' && (
        <div className="space-y-5 animate-in">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                <Receipt className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-base font-semibold">Bill from {request.workerName ?? 'your worker'}</p>
                <p className="text-xs text-muted-foreground">Job completed — review and pay to close it out.</p>
              </div>
            </div>

            <div className="mt-4 space-y-2 border-t border-border/60 pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Materials</span>
                <span className="font-medium">{inr(request.bill.productsCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Labour {request.workerName ? `· ${request.workerName}` : ''}</span>
                <span className="font-medium">{inr(request.bill.laborWage)}</span>
              </div>
              {request.bill.note && (
                <p className="pt-1 text-xs italic text-muted-foreground">“{request.bill.note}”</p>
              )}
              <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-3">
                <span className="font-semibold">Total payable</span>
                <span className="font-mono text-lg font-bold text-primary">{inr(request.bill.total)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm font-semibold">Pay with</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {PAY_METHODS.map((m) => {
                const Icon = m.icon
                const active = method === m.key
                return (
                  <button
                    key={m.key}
                    onClick={() => setMethod(m.key)}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors cursor-pointer',
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-foreground hover:border-primary/50',
                    )}
                  >
                    <Icon className="h-4 w-4" /> {m.label}
                  </button>
                )
              })}
            </div>
            <Button className="mt-4 w-full" size="lg" onClick={handlePay} disabled={paying}>
              {paying ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Confirming…</>
              ) : (
                <>Confirm {method.toUpperCase()} payment · {inr(request.bill.total)}</>
              )}
            </Button>
          </div>
        </div>
      )}

      {status === 'completed' && request.bill && request.paymentStatus === 'paid' && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
            <Check className="h-7 w-7" />
          </div>
          <p className="font-display text-lg font-semibold">Job marked complete</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Bill of <strong>{inr(request.bill.total)}</strong> was paid via{' '}
            <strong>{request.paymentMethod?.toUpperCase() ?? 'cash'}</strong>. Thank you for using GeoFix!
          </p>
          {!request.ratingGiven && request.workerId && (
            <Button onClick={() => navigate(`/customer/rate/${request.id}`)}>
              Rate {request.workerName ?? 'worker'}
            </Button>
          )}
          {request.ratingGiven && <p className="text-sm text-muted-foreground">You’ve already rated this job — thanks!</p>}
        </div>
      )}

      {status === 'completed' && !request.bill && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
            <Check className="h-7 w-7" />
          </div>
          <p className="font-display text-lg font-semibold">Job marked complete</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Thank you for using GeoFix. The worker will send the bill here shortly.
          </p>
        </div>
      )}

      {(status === 'completed' || ACTIVE_STATUSES.includes(status!)) && (
        <button
          onClick={() => navigate(`/customer/complaint/${request.id}`)}
          className="mx-auto flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-destructive cursor-pointer"
        >
          <ShieldAlert className="h-3.5 w-3.5" /> Report a problem with this job
        </button>
      )}

      {/* Cancelled */}
      {status === 'cancelled' && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-10 text-center text-muted-foreground">
          <p className="font-display text-lg font-semibold">Request was cancelled</p>
          <p className="max-w-sm text-sm">Need something fixed? Start a new request any time.</p>
          <Button onClick={() => navigate('/customer/new')} className="gap-2">
            New request <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="rounded-xl border border-border bg-muted/30 px-5 py-3 text-xs text-muted-foreground">
        <p>
          Data stays in sync between this website and the GeoFix mobile app. If your worker accepted on their phone,
          you’ll see it here instantly.
        </p>
      </div>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
            <AlertDialogDescription>
              {request && request.title ? <>“{request.title}”</> : <>Your request</>} will be cancelled and the worker
              will be notified. This can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep booking</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? 'Cancelling…' : 'Yes, cancel booking'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}