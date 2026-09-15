import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ShieldAlert, Loader2 } from 'lucide-react'
import { useRequestLive } from '@/hooks/use-requests'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { raiseDispute } from '@/services/requests.service'
import { toastSuccess } from '@/hooks/use-toast'
import { StatusBadge } from '@/components/status-badge'

const REASONS = [
  'Late arrival',
  'Poor work quality',
  'Overcharging / billing issue',
  'Left job unfinished',
  'Damaged something in my home',
  'Wrong worker showed up',
  'Other',
]

export default function CustomerComplaint() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: request, isLoading } = useRequestLive(id)
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!request) return
    if (!reason) {
      setError('Pick a reason for the complaint')
      return
    }
    setBusy(true)
    const ok = await raiseDispute(request.id, reason, description.trim())
    setBusy(false)
    if (ok) {
      toastSuccess('Complaint filed', 'Our support team will look into it shortly.')
      navigate(`/customer/requests/${request.id}`)
    } else {
      setError('Could not submit the complaint. Please try again.')
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
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <p className="font-display text-xl font-semibold">Request not found</p>
        <Button onClick={() => navigate('/customer/dashboard')}>Back to dashboard</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/customer/requests/${request.id}`)}
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to request
        </button>
        <StatusBadge status={request.status} />
      </div>

      <div className="paper-card">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
            <ShieldAlert className="h-5 w-5" />
          </span>
          <div>
            <span className="eyebrow">Customer support</span>
            <h1 className="font-display text-2xl font-bold tracking-tight">Report a problem</h1>
          </div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {request.title} · {request.category}
          {request.workerName ? ` · ${request.workerName}` : ''}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="reason">What went wrong?</Label>
            <Select value={reason} onValueChange={(v) => { setReason(v); setError('') }}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Choose a reason" />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Describe the issue (optional)</Label>
            <Textarea
              id="description"
              rows={5}
              placeholder="Add details — what happened, when, and anything we should know."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {error && <p className="text-xs font-medium text-destructive">{error}</p>}

          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : 'Submit complaint'}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Complaints go straight to the GeoFix support team, who’ll get back to you within 24 hours.
          </p>
        </form>
      </div>
    </div>
  )
}