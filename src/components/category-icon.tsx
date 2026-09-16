import { Droplet, Zap, Hammer, Paintbrush, Tv, KeyRound, Snowflake, Wrench } from 'lucide-react'
import type { ServiceCategory } from '@/lib/types'

const ICON_MAP: Record<ServiceCategory, React.ComponentType<{ className?: string }>> = {
  Plumbing: Droplet,
  Electrical: Zap,
  Carpentry: Hammer,
  Painting: Paintbrush,
  Appliance: Tv,
  Locksmith: KeyRound,
  'AC / HVAC': Snowflake,
  General: Wrench,
}

export function CategoryIcon({
  category,
  className,
}: {
  category: string
  className?: string
}) {
  const Icon = ICON_MAP[category as ServiceCategory] ?? Wrench
  return <Icon className={className} />
}