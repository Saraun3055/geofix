import { useNavigate } from 'react-router-dom'
import { History, MapPin, Wrench, Receipt } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { useWorkerJobs } from '@/hooks/use-requests'
import { useRatingsForWorker } from '@/hooks/use-ratings'
import { Stars } from '@/components/stars'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { timeAgoShort } from '@/lib/utils'
import { markCompleted } from '@/services/requests.service'
import { useState } from 'react'
import { toastSuccess } from '@/hooks/use-toast'
import type { ServiceRequestDoc } from '@/lib/types'

export default function WorkerJobs() {
  const uid = useAuthStore((s) => s.uid)!
  const navigate = useNavigate()
  const { data: jobs, isLoading } = useWorkerJobs(uid)
  const { data: ratings } = useRatingsForWorker(uid)
  const [billJob, setBillJob] = useState<ServiceRequestDoc | null>(null)
  const [productsCost, setProductsCost] = useState('')
  const [laborWage, setLaborWage] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [touched, setTouched] = useState(false)

  function openBillDialog(job: ServiceRequestDoc) {
    setBillJob(job)
    setProductsCost('')
    setLaborWage('')
    setNote('')
    setTouched(false)
  }

  const products = Math.max(0, Math.round(Number(productsCost) || 0))
  const labor = Math.max(0, Math.round(Number(laborWage) || 0))
  const total = products + labor

  async function submitBill() {
    if (!billJob) return
    setTouched(true)
    if (products <= 0 && labor <= 0) return
    setSaving(true)
    const ok = await markCompleted(billJob.id, uid, {
      productsCost: products,
      laborWage: labor,
      note: note.trim() || undefined,
    })
    setSaving(false)
    setBillJob(null)
    if (ok) toastSuccess('Job completed', 'The bill was sent to your customer.')
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-52" />
        {[0, 1].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 animate-in">
      <div>
        <span className="eyebrow">Worker portal</span>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Job history</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Accepted jobs and the ratings customers left you.
        </p>
      </div>

      {!jobs || jobs.length === 0 ? (
        <EmptyState
          icon={History}
          title="No jobs yet"
          description="Once a customer accepts your match and you finish a job, everything lands here."
          action={<Button variant="outline" onClick={() => navigate('/worker/dashboard')}>Stay online →</Button>}
        />
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const rating = ratings?.find((r) => r.requestId === job.id)
            return (
            <div key={job.id} className="paper-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                      <Wrench className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{job.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {job.customerName ?? 'Customer'} · {job.category} · {timeAgoShort(job.createdAt)} ago
                      </p>
                    </div>
                  </div>
                </div>
                <Badge variant={job.status === 'completed' ? 'success' : 'warning'}>
                  {job.status === 'completed' ? 'Complete' : 'In progress'}
                </Badge>
              </div>

              {job.bill && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Receipt className="h-3.5 w-3.5" />
                  Bill sent · ₹{job.bill.total.toLocaleString('en-IN')} ·{' '}
                  {job.paymentStatus === 'paid' ? `paid via ${job.paymentMethod?.toUpperCase() ?? '—'}` : 'waiting for payment'}
                </p>
              )}

              {job.customerAddress && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {job.customerAddress}
                </p>
              )}

              <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                {job.status === 'accepted' ? (
                  <Dialog open={billJob?.id === job.id} onOpenChange={(open) => !open && setBillJob(null)}>
                    <DialogTrigger asChild>
                      <Button size="sm" onClick={() => openBillDialog(job)}>Mark as complete</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Bill for the job</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-1">
                        <p className="text-sm text-muted-foreground">
                          Add the materials cost and your labour charge for <strong>{job.title}</strong>. Your customer
                          will review this bill before paying.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="products-cost">Materials (₹)</Label>
                            <Input
                              id="products-cost"
                              type="number"
                              min={0}
                              inputMode="numeric"
                              placeholder="0"
                              value={productsCost}
                              onChange={(e) => setProductsCost(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="labor-wage">Labour (₹)</Label>
                            <Input
                              id="labor-wage"
                              type="number"
                              min={0}
                              inputMode="numeric"
                              placeholder="0"
                              value={laborWage}
                              onChange={(e) => setLaborWage(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="bill-note">Note (optional)</Label>
                          <Input
                            id="bill-note"
                            placeholder="e.g. pipe + fittings replaced"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                          />
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3">
                          <span className="text-sm font-medium">Total bill</span>
                          <span className="font-mono text-lg font-bold">₹{total.toLocaleString('en-IN')}</span>
                        </div>
                        {touched && products <= 0 && labor <= 0 && (
                          <p className="text-xs font-medium text-destructive">Enter at least one amount to send a bill.</p>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setBillJob(null)}>Cancel</Button>
                        <Button onClick={submitBill} disabled={saving}>
                          {saving ? 'Sending…' : 'Complete & send bill'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Completed {timeAgoShort(job.completedAt ?? job.createdAt)} ago
                  </p>
                )}
                <div className="flex items-center gap-1.5 text-xs">
                  {rating && (
                    <>
                      <span className="font-medium">Rating:</span>
                      <Stars value={rating.rating} size={13} />
                      {rating.comment && (
                        <span className="ml-1 hidden max-w-[180px] truncate text-muted-foreground sm:inline">
                          “{rating.comment}”
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            )
          })}
        </div>
      )}
    </div>
  )
}