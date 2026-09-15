import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Camera,
  MapPin,
  X,
  FileText,
  ArrowRight,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { useCurrentLocation, DEFAULT_LOCATION } from '@/hooks/use-geo'
import { createRequest } from '@/services/requests.service'
import { uploadPhotos, readAsDataUrl } from '@/lib/storage'
import { CATEGORY_LIST } from '@/lib/types'
import { isDemo } from '@/lib/mode'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { toastError, toastSuccess } from '@/hooks/use-toast'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

export default function CustomerNewRequest() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const uid = useAuthStore((s) => s.uid)!
  const name = useAuthStore((s) => s.name) ?? 'Customer'

  const [category, setCategory] = useState(params.get('category') ?? '')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  // In demo mode we pin to the seeded demo city (Madurai) so nearby workers
  // always show up — no browser permission prompt, no empty radius.
  const { coords: geoCoords, loading: geoLoading, error: geoError } = useCurrentLocation(!isDemo)
  const coords = isDemo ? DEFAULT_LOCATION : geoCoords ?? DEFAULT_LOCATION

  async function handleFiles(newFiles: File[]) {
    const urls: string[] = []
    for (const f of newFiles) {
      urls.push(await readAsDataUrl(f))
    }
    setFiles((prev) => [...prev, ...newFiles])
    setPreviews((prev) => [...prev, ...urls])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      toastError('Title required', 'Give the worker a quick idea of the issue')
      return
    }
    setBusy(true)
    try {
      const photoUrls = files.length > 0
        ? await uploadPhotos(files, `requests/${uid}/${Date.now()}`)
        : []
      const id = await createRequest(uid, name, {
        category,
        title: title.trim(),
        description: description.trim(),
        photoUrls,
        location: { latitude: coords.lat, longitude: coords.lng },
        address: address.trim() || undefined,
      })
      toastSuccess('Request created', 'Now choose a nearby worker')
      navigate(`/customer/new/workers?request=${id}`)
    } catch (err) {
      toastError('Oops', err instanceof Error ? err.message : 'Something went wrong')
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-in">
      <div>
        <span className="eyebrow">New repair request</span>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">What needs fixing in Madurai?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a category — Simmakkal, Anna Nagar, KK Nagar, Goripalayam & more. Add a photo for faster fixes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Pick a category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_LIST.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="title">What’s wrong? (short title)</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Leaking kitchen faucet"
            className="h-11"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="desc">More details (optional)</Label>
          <Textarea
            id="desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="When it started, anything unusual you noticed, access notes for the worker…"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Photos</Label>
          <label
            className={cn(
              'flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary',
            )}
          >
            <Camera className="h-5 w-5" />
            <span>Tap to upload</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => {
                if (e.target.files) handleFiles(Array.from(e.target.files))
              }}
            />
          </label>
          {previews.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {previews.map((url, i) => (
                <div key={i} className="relative h-20 w-20 overflow-hidden rounded-lg border border-border">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setFiles((prev) => prev.filter((_, j) => j !== i))
                      setPreviews((prev) => prev.filter((_, j) => j !== i))
                    }}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
                <MapPin className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold">Location</p>
                <p className="text-xs text-muted-foreground">
                  {geoLoading
                    ? 'Detecting…'
                    : coords === DEFAULT_LOCATION
                      ? 'Using default — update below'
                      : `Lat ${coords.lat.toFixed(4)}, Lng ${coords.lng.toFixed(4)}`}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <Input
              placeholder="Street address or landmark (for the worker)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-10"
            />
          </div>
          {geoError && (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {geoError} You can still submit with the coordinates shown, or type an address manually.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" type="button" onClick={() => navigate('/customer/dashboard')}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy} className="gap-2 px-6" size="lg">
            {busy ? <Spinner size={18} /> : <FileText className="h-4 w-4" />}
            {busy ? 'Submitting…' : 'Find nearby workers'}
            {!busy && <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  )
}