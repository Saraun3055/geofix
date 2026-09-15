import { Star, StarHalf } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Stars({
  value,
  size = 16,
  className = '',
  showValue = false,
}: {
  value: number
  size?: number
  className?: string
  showValue?: boolean
}) {
  const full = Math.floor(value)
  const half = value - full >= 0.4
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < full) {
          return <Star key={i} width={size} height={size} className="fill-amber-400 text-amber-400" />
        }
        if (i === full && half) {
          return <StarHalf key={i} width={size} height={size} className="fill-amber-400 text-amber-400" />
        }
        return <Star key={i} width={size} height={size} className="text-muted-foreground/30" />
      })}
      {showValue && <span className="ml-1.5 text-sm font-semibold">{value.toFixed(1)}</span>}
    </span>
  )
}

export function StarInput({
  value,
  onChange,
  size = 32,
}: {
  value: number
  onChange: (v: number) => void
  size?: number
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <button
          key={i}
          type="button"
          className="transition-transform hover:scale-110 cursor-pointer"
          onClick={() => onChange(i + 1)}
          aria-label={`${i + 1} star${i ? 's' : ''}`}
        >
          <Star
            width={size}
            height={size}
            className={cn(
              i < value ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-muted-foreground/40',
              'transition-colors',
            )}
          />
        </button>
      ))}
    </div>
  )
}