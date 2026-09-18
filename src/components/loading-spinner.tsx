import { Spinner } from '@/components/ui/spinner'

export function LoadingSpinner() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
      <Spinner size={28} className="text-primary" />
    </div>
  )
}