import { useMemo } from 'react'
import { GoogleMap, Marker } from '@react-google-maps/api'
import { MapPin } from 'lucide-react'
import { CategoryIcon } from '@/components/category-icon'
import { cn } from '@/lib/utils'

const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

export interface MapMarker {
  id: string
  lat: number
  lng: number
  label?: string
  color?: string
  kind?: 'request' | 'worker' | 'user'
  category?: string
}

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
}

export function MapView({
  markers,
  center,
  zoom = 13,
  height = 320,
  className,
  activeId,
  onMarkerSelect,
}: {
  markers: MapMarker[]
  center: { lat: number; lng: number }
  zoom?: number
  height?: number
  className?: string
  activeId?: string
  onMarkerSelect?: (id: string) => void
}) {
  const hasKey = Boolean(GMAPS_KEY)

  if (!hasKey) {
    return <MockMap markers={markers} center={center} height={height} className={className} activeId={activeId} onMarkerSelect={onMarkerSelect} />
  }

  return (
    <div className={cn('overflow-hidden rounded-xl border border-border', className)} style={{ height }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={zoom}
        options={mapOptions}
      >
        {markers.map((m) => {
          const isActive = m.id === activeId
          return (
            <Marker
              key={m.id}
              position={{ lat: m.lat, lng: m.lng }}
              title={m.label}
              onClick={() => onMarkerSelect?.(m.id)}
              zIndex={isActive ? 10 : 1}
              icon={{
                path: typeof window !== 'undefined' && (window as any).google?.maps?.SymbolPath?.CIRCLE,
                fillColor: m.color ?? '#7a1b1c',
                fillOpacity: 1,
                strokeColor: isActive ? '#fff' : '#fff',
                strokeWeight: isActive ? 4 : 2,
                scale: isActive ? 13 : 9,
              }}
            />
          )
        })}
      </GoogleMap>
    </div>
  )
}

/** Offline-friendly stylized map used when no Google Maps key is configured. */
function MockMap({
  markers,
  center,
  height,
  className,
  activeId,
  onMarkerSelect,
}: {
  markers: MapMarker[]
  center: { lat: number; lng: number }
  height?: number
  className?: string
  activeId?: string
  onMarkerSelect?: (id: string) => void
}) {
  const bounds = useMemo(() => {
    const lats = markers.map((m) => m.lat)
    const lngs = markers.map((m) => m.lng)
    if (lats.length === 0) {
      return { minLat: center.lat - 0.02, maxLat: center.lat + 0.02, minLng: center.lng - 0.02, maxLng: center.lng + 0.02 }
    }
    const minLat = Math.min(...lats, center.lat)
    const maxLat = Math.max(...lats, center.lat)
    const minLng = Math.min(...lngs, center.lng)
    const maxLng = Math.max(...lngs, center.lng)
    const pad = Math.max((maxLat - minLat) * 0.3, (maxLng - minLng) * 0.3, 0.01)
    return { minLat: minLat - pad, maxLat: maxLat + pad, minLng: minLng - pad, maxLng: maxLng + pad }
  }, [markers, center])

  return (
    <div
      className={cn('geo-dots relative overflow-hidden rounded-xl border border-border bg-background', className)}
      style={{ height: height ?? 320 }}
    >
      <div className="absolute inset-0 opacity-60" style={{ background: 'linear-gradient(135deg,#fdf6f5 0%,#ffffff 100%)' }} />
      {markers.map((m) => {
        const x = ((m.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100
        const y = 100 - ((m.lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100
        const isWorker = m.kind === 'worker'
        const isActive = m.id === activeId
        return (
          <div
            key={m.id}
            className={cn(
              'absolute -translate-x-1/2 -translate-y-1/2',
              onMarkerSelect && 'cursor-pointer transition-transform duration-200',
              isActive && 'z-10 scale-125',
            )}
            style={{ left: `${x}%`, top: `${y}%` }}
            onClick={onMarkerSelect ? () => onMarkerSelect(m.id) : undefined}
          >
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-white shadow-lg ring-4 transition-all duration-200',
                isActive ? 'ring-caramel-300/90' : 'ring-white/70',
              )}
              style={{ backgroundColor: m.color ?? (isWorker ? '#8c2425' : '#7a1b1c') }}
            >
              {isWorker ? <CategoryIcon category={m.category ?? ''} className="h-3.5 w-3.5" /> : <MapPin className="h-4 w-4" />}
            </div>
            {m.label && <div className="mt-1 rounded-md bg-white/90 px-1.5 py-0.5 text-center text-[10px] font-medium shadow-sm">{m.label}</div>}
          </div>
        )
      })}
      <div className="absolute bottom-2 right-2 rounded-md bg-white/70 px-2 py-1 text-[10px] text-muted-foreground">
        {markers.length} live pin{markers.length === 1 ? '' : 's'}
      </div>
    </div>
  )
}