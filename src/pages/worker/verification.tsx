import { useRef, useState } from 'react'
import {
  ShieldCheck,
  UploadCloud,
  CheckCircle2,
  XCircle,
  Loader2,
  FileBadge,
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

  const status = profile?.verificationStatus ?? 'pending'

  function pickFile(f: File) {
    if (!f.type.startsWith('image/') && f.type !== 'application/pdf') {
      toastError('Unsupported file', 'Upload a photo or PDF of your government ID')
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
              status === 'approved'
                ? 'border-emerald-200 bg-emerald-50'
                : status === 'rejected'
                  ? 'border-rose-200 bg-rose-50'
                  : 'border-amber-200 bg-amber-50',
            )}
          >
            {status === 'approved' ? (
              <CheckCircle2 className="h-9 w-9 text-emerald-600" />
            ) : status === 'rejected' ? (
              <XCircle className="h-9 w-9 text-rose-600" />
            ) : (
              <Loader2 className="h-9 w-9 animate-spin text-amber-600" />
            )}
            <div>
              <p className="font-display text-base font-semibold">
                {status === 'approved'
                  ? 'You are verified'
                  : status === 'rejected'
                    ? 'Verification rejected — resubmit'
                    : 'Verification in review'}
              </p>
              <p className="text-sm text-muted-foreground">
                {status === 'approved'
                  ? 'Your verified badge now shows on every worker list.'
                  : status === 'rejected'
                    ? 'Upload a clearer copy of your government ID below.'
                    : 'Your submission is being reviewed. You can upload a new copy any time.'}
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
              <img src={preview} alt="Preview" className="mt-4 max-h-56 rounded-lg border border-border" />
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
            <Badge variant={status === 'approved' ? 'success' : 'muted'}>
              Current status: {status}
            </Badge>
          </div>
        </>
      )}
    </div>
  )
}