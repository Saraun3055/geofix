import { Badge } from '@/components/ui/badge'
import { STATUS_LABEL, STATUS_COLOR, type RequestStatus } from '@/lib/types'

export function StatusBadge({ status }: { status: RequestStatus }) {
  return <Badge className={STATUS_COLOR[status] ?? 'bg-muted'}>{STATUS_LABEL[status] ?? status}</Badge>
}