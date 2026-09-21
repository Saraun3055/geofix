import { useRef, useState } from 'react'
import {
  ShieldCheck,
  UploadCloud,
  CheckCircle2,
  XCircle,
  Loader2,
  FileBadge,
  Clock,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { useWorkerProfile } from '@/hooks/use-workers'
import { submitVerification } from '@/services/worker.service'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { toastError } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export default function WorkerVerification() {
  const uid = useAuthStore((s) => s.uid)!
  const name = useAuthStore((s) => s.name) ?? 'Worker'
  const { data: profile, isLoading } = useWorkerProfile(uid)
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const profileStatus = profile?.verificationStatus ?? 'pending'
  const hasDoc = !!profile?.govIdUrl
  const phase: 'pending' | 'in-progress' | 'approved' | 'rejected' =
    profileStatus === 'approved'
      ? 'approved'
      : profileStatus === 'rejected'
        ? 'rejected'
        : hasDoc
          ? 'in-progress'
          : 'pending'

  const PHASE_LABEL: Record<typeof phase, string> = {
    pending: 'Pending',
    'in-progress': 'In progress',
    approved: 'Approved',
    rejected: 'Rejected',
  }

  const MAX_FILE_MB = 5

  function pickFile(f: File) {
    if (!f.type.startsWith('image/') && f.type !== 'application/pdf') {
      toastError('Unsupported file', 'Upload a photo or PDF of your government ID')
      return
    }
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      toastError('File too large', `Keep your ID photo under ${MAX_FILE_MB} MB — take a clearer, smaller photo.`)
      return
    }
    setFile(f)
    if (f.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => setPreview(reader.result as string)
      reader.readAsDataURL(f)
    } else {
      setPreview(null)
    }
  }

  async function submit() {
    if (!file) {
      toastError('No file selected', 'Choose your government ID to upload')
      return
    }
    setBusy(true)
    await submitVerification(uid, name, file)
    setBusy(false)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-in">
      <div>
        <span className="eyebrow">Worker portal</span>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Identity verification</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Customers only see verified workers. Submit your government ID once — the team reviews it within 24 hours.
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <>
          {/* Status card */}
          <div
            className={cn(
              'flex items-center gap-4 rounded-xl border p-5',
              phase === 'approved'
                ? 'border-sage-200 bg-sage-50 shadow-[0_10px_30px_-18px_rgba(122,27,28,0.45)]'
                : phase === 'rejected'
                  ? 'border-rust-300 bg-rust-50'
                  : 'border-caramel-200 bg-caramel-50',
            )}
          >
            {phase === 'approved' ? (
              <CheckCircle2 className="h-9 w-9 text-sage-600" />
            ) : phase === 'rejected' ? (
              <XCircle className="h-9 w-9 text-rust-800" />
            ) : phase === 'in-progress' ? (
              <Loader2 className="h-9 w-9 animate-spin text-caramel-700" />
            ) : (
              <Clock className="h-9 w-9 text-caramel-700" />
            )}
            <div>
              <p className="font-display text-base font-semibold">
                {phase === 'approved'
                  ? 'You are verified'
                  : phase === 'rejected'
                    ? 'Verification rejected — resubmit'
                    : phase === 'in-progress'
                      ? 'Verification in progress'
                      : 'Verification pending'}
              </p>
              <p className="text-sm text-muted-foreground">
                {phase === 'approved'
                  ? 'Your verified badge now shows on every worker list.'
                  : phase === 'rejected'
                    ? 'Upload a clearer copy of your government ID below.'
                    : phase === 'in-progress'
                      ? 'Your submission is being reviewed. You can upload a new copy any time.'
                      : 'Upload your government ID to start verification. Customers only see verified workers.'}
              </p>
            </div>
          </div>

          {profile?.govIdUrl && !preview && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Last submitted copy
              </p>
              {profile.govIdUrl.startsWith('data:') ? (
                <img src={profile.govIdUrl} alt="ID" className="max-h-52 rounded-lg border" />
              ) : (
                <a
                  href={profile.govIdUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <FileBadge className="h-4 w-4" /> View previous submission
                </a>
              )}
            </div>
          )}

          {/* Upload zone */}
          <div className="paper-card p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-base font-semibold">Upload government ID</p>
                <p className="text-sm text-muted-foreground">
                  Passport, driver’s licence or national ID. Photo or PDF.
                </p>
              </div>
            </div>

            <button
              onClick={() => inputRef.current?.click()}
              className="mt-5 flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 px-6 py-10 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary cursor-pointer"
            >
              <UploadCloud className="h-7 w-7" />
              <span className="font-medium">{file ? file.name : 'Click to choose a file'}</span>
              <span className="text-xs">Max 5 MB</span>
              <input
                ref={inputRef}
                type="file"
                accept="image/*,.pdf"
                className="sr-only"
                onChange={(e) => {
                  if (e.target.files?.[0]) pickFile(e.target.files[0])
                }}
              />
            </button>

            {preview && (
              <div className="mt-4 animate-scale-in overflow-hidden rounded-xl border border-primary/30 bg-muted/30 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">New submission preview</p>
                  <button
                    type="button"
                    onClick={() => {
                      setPreview(null)
                      setFile(null)
                      if (inputRef.current) inputRef.current.value = ''
                    }}
                    className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
                <img
                  src={preview}
                  alt="ID preview"
                  className="mx-auto max-h-56 rounded-lg border border-border shadow-sm"
                />
              </div>
            )}

            <div className="mt-5 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Your ID is visible only to the GeoFix moderation team.
              </p>
              <Button onClick={submit} disabled={busy || !file}>
                {busy ? 'Uploading…' : 'Submit for review'}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant={phase === 'approved' ? 'success' : 'muted'}>
              Current status: {PHASE_LABEL[phase]}
            </Badge>
          </div>
        </>
      )}
    </div>
  )
}