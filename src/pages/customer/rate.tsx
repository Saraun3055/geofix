import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ThumbsUp, ArrowLeft, Receipt } from 'lucide-react'
import { useRequestLive } from '@/hooks/use-requests'
import { useAuthStore } from '@/stores/auth'
import { rateWorker } from '@/services/requests.service'
import { StarInput } from '@/components/stars'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { toastSuccess } from '@/hooks/use-toast'
import { useRatingDistribution } from '@/hooks/use-admin'

export default function CustomerRate() {
  const { id } = useParams<{ id: string }>()
  const uid = useAuthStore((s) => s.uid)!
  const name = useAuthStore((s) => s.name) ?? 'Customer'
  const navigate = useNavigate()

  const { data: request, isLoading } = useRequestLive(id)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const { data: dist } = useRatingDistribution()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (rating < 1) {
      document.querySelector('#rate-error')?.classList.remove('opacity-0')
      return
    }
    if (!request || !request.workerId) return
    setBusy(true)
    const ok = await rateWorker(request.id, request.workerId, uid, name, rating, comment.trim() || undefined)
    setBusy(false)
    if (ok) {
      toastSuccess('Thanks!', 'Your rating helps the next customer.')
      navigate('/customer/dashboard')
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size={28} className="text-primary" />
      </div>
    )
  }

  if (!request || !request.workerId) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <p className="font-display text-xl font-semibold">Nothing to rate here</p>
        <Button onClick={() => navigate('/customer/dashboard')}>Back</Button>
      </div>
    )
  }

  if (request.status !== 'completed' || request.paymentStatus !== 'paid') {
    return (
      <div className="mx-auto max-w-xl space-y-6 animate-in">
        <button
          onClick={() => navigate('/customer/dashboard')}
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </button>
        <div className="paper-card flex flex-col items-center gap-4 px-6 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-primary">
            <Receipt className="h-7 w-7" />
          </span>
          <p className="font-display text-lg font-semibold">Complete your payment first</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Reviews open after the job is finished and the bill is paid, so ratings stay honest.
          </p>
          <Button onClick={() => navigate(`/customer/requests/${request.id}`)}>View bill & pay</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-in">
      <button
        onClick={() => navigate('/customer/dashboard')}
        className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </button>

      <div className="paper-card text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
          <ThumbsUp className="h-7 w-7 text-primary" />
        </div>
        <span className="eyebrow">Rate your worker</span>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight">{request.workerName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {request.category} · {request.title}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-5 text-left">
          <div className="flex flex-col items-center gap-2">
            <StarInput value={rating} onChange={setRating} size={38} />
            <p id="rate-error" className="text-xs font-medium text-destructive opacity-0 transition-opacity">
              Tap a star to rate your experience
            </p>
          </div>

          <Textarea
            rows={4}
            placeholder="How did it go? Fast, careful, fairly priced… (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {busy ? <Spinner size={18} /> : 'Submit rating'}
          </Button>
        </form>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm font-semibold">Rating snapshot</p>
        <div className="mt-3 space-y-2">
          {[...(dist ?? [])]
            .sort((a, b) => b.stars - a.stars)
            .map((d) => (
              <div key={d.stars} className="flex items-center gap-3 text-xs">
                <span className="w-10 shrink-0 font-mono">{d.stars} ★</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{ width: `${d.count > 0 ? (d.count / Math.max(1, (dist ?? []).reduce((a, b) => a + b.count, 0))) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-6 text-right font-mono text-muted-foreground">{d.count}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}