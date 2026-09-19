import { useEffect, useMemo, useRef, useState } from 'react'
import { MapPin, Search, X, Navigation } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  searchMaduraiLocations,
  getNearbyLocations,
  formatLocation,
  type MaduraiLocation,
} from '@/lib/madurai-locations'
import { cn } from '@/lib/utils'

const POPULAR_QUERIES = ['Simmakkal', 'Tallakulam', 'Thiruparankundram', 'Anna Nagar', 'Melur', 'Usilampatti', 'Tirumangalam', 'Alanganallur', 'Vadipatti', 'Sholavandan']

export interface PincodeLocationPickerProps {
  /**
   * The currently selected Madurai region (pincode + area), or null.
   * The parent owns this so saving a request/profile is trivial.
   */
  value: MaduraiLocation | null
  onChange: (location: MaduraiLocation | null) => void
  id?: string
  placeholder?: string
  className?: string
  /** Hide the "Nearby regions" quick-select shown after picking. */
  hideNearby?: boolean
  autoFocus?: boolean
}

export function PincodeLocationPicker({
  value,
  onChange,
  id,
  placeholder = 'Search pincode or area (e.g. 625706, Simmakkal)',
  className,
  hideNearby = false,
  autoFocus,
}: PincodeLocationPickerProps) {
  const [query, setQuery] = useState(value?.name ?? '')
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(value ? `${value.name} · ${value.pincode}` : '')
  }, [value])

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const results = useMemo(() => {
    if (!open) return []
    const q = query.replace(/\s*·.*$/, '').trim()
    if (q) return searchMaduraiLocations(q, 8)
    const popular: MaduraiLocation[] = []
    for (const p of POPULAR_QUERIES) {
      const hit = searchMaduraiLocations(p, 1)[0]
      if (hit && !popular.some((x) => x.pincode === hit.pincode)) popular.push(hit)
    }
    return popular
  }, [open, query])

  const nearby = useMemo(() => {
    if (!value) return []
    return getNearbyLocations(value.pincode, 8).filter((n) => n.location.pincode !== value.pincode)
  }, [value])

  function select(loc: MaduraiLocation) {
    onChange(loc)
    setQuery(`${loc.name} · ${loc.pincode}`)
    setOpen(false)
  }

  function clear() {
    onChange(null)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={rootRef} className={cn('relative space-y-2', className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
        <Input
          id={id}
          className="h-11 pl-9 pr-9"
          placeholder={placeholder}
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
        />
        {query && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear location"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 z-40 mt-1 overflow-hidden rounded-lg border border-border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95">
          <p className="border-b border-border/60 bg-muted/40 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {query.replace(/\s*·.*$/, '').trim() ? `${results.length} Madurai region${results.length === 1 ? '' : 's'}` : 'Popular areas'}
          </p>
          <ul className="max-h-64 overflow-y-auto">
            {results.map((loc) => (
              <li key={`${loc.name}-${loc.pincode}`}>
                <button
                  type="button"
                  onClick={() => select(loc)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted cursor-pointer"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{loc.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      <span className="font-mono font-medium text-foreground/70">{loc.pincode}</span> · {loc.district}, {loc.state}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {value && !hideNearby && nearby.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/30 p-2.5">
          <p className="flex items-center gap-1.5 px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <Navigation className="h-3 w-3" /> Nearby regions within ~30 km
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {nearby.map(({ location: loc, distanceKm }) => (
              <button
                key={`${loc.name}-${loc.pincode}`}
                type="button"
                onClick={() => select(loc)}
                title={formatLocation(loc)}
                className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground cursor-pointer"
              >
                {loc.name} · {loc.pincode}
                <span className="ml-1 text-[10px] text-muted-foreground/70">{Math.round(distanceKm)} km</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}