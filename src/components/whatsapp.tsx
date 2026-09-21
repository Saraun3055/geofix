import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle, Copy, ExternalLink, Phone } from 'lucide-react'
import { toastSuccess } from '@/hooks/use-toast'

export function buildWhatsAppUrl(
  phone: string,
  opts: { requestTitle?: string; category?: string; address?: string; mapsUrl?: string; workerName?: string },
): string {
  const formatted = phone.replace(/[^\d]/g, '')
  const text = [
    `Hi${opts.workerName ? ' ' + opts.workerName : ''}, I matched with you on GeoFix`,
    opts.requestTitle ? `· Request: ${opts.requestTitle}` : undefined,
    opts.category ? `· Category: ${opts.category}` : undefined,
    opts.address ? `· Location: ${opts.address}` : undefined,
    opts.mapsUrl ? `· Map: ${opts.mapsUrl}` : undefined,
    '— sent via GeoFix',
  ]
    .filter(Boolean)
    .join('\n')
  return `https://wa.me/${formatted}?text=${encodeURIComponent(text)}`
}

export function buildMapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`
}

export function WhatsAppHandoff({
  phone,
  workerName,
  requestTitle,
  category,
  address,
  lat,
  lng,
}: {
  phone: string
  workerName?: string
  requestTitle?: string
  category?: string
  address?: string
  lat: number
  lng: number
}) {
  const mapsUrl = buildMapsUrl(lat, lng)
  const url = buildWhatsAppUrl(phone, {
    requestTitle,
    category,
    address,
    mapsUrl,
    workerName,
  })

  const [copied, setCopied] = useState(false)
  const [copiedNumber, setCopiedNumber] = useState(false)
  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(t)
  }, [copied])
  useEffect(() => {
    if (!copiedNumber) return
    const t = setTimeout(() => setCopiedNumber(false), 2000)
    return () => clearTimeout(t)
  }, [copiedNumber])

  function copyPhone() {
    navigator.clipboard.writeText(phone)
    setCopiedNumber(true)
    toastSuccess('Copied', `${phone} copied to clipboard`)
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Button
          className="h-12 gap-2 bg-sage-600 hover:bg-sage-700 text-white text-base"
          onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
        >
          <MessageCircle className="h-5 w-5" />
          Open in WhatsApp
        </Button>
        <Button
          variant="outline"
          className="h-12 gap-2"
          onClick={copyPhone}
          disabled={!phone}
        >
          <Phone className="h-4 w-4" />
          {copiedNumber ? 'Copied!' : 'Copy number'}
        </Button>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        WhatsApp blocked the popup?{' '}
        <a className="text-primary underline underline-offset-2" href={url} target="_blank" rel="noreferrer">
          Tap here
        </a>{' '}
        instead.
      </p>
      <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs">
        <p className="mb-1 font-semibold uppercase tracking-wide text-muted-foreground">Manual fallback</p>
        <p className="mb-2 break-words text-muted-foreground">
          Message the worker at <span className="font-semibold text-foreground">{phone}</span> — or copy the pre-written
          text below:
        </p>
        <p className="mb-2 whitespace-pre-wrap rounded-md bg-background p-2 text-foreground/80">{decodeURIComponent(url.split('text=')[1] ?? '')}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            navigator.clipboard.writeText(url)
            setCopied(true)
            if (!copied) toastSuccess('Copied', 'WhatsApp link copied to clipboard')
          }}
        >
          <Copy className="h-3.5 w-3.5" /> {copied ? 'Copied!' : 'Copy link'}
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <a href={mapsUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="h-3.5 w-3.5" /> Open map link
          </a>
        </Button>
      </div>
    </div>
  )
}