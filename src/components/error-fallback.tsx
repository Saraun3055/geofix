import { AlertTriangle, RotateCcw, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error?: unknown
  resetErrorBoundary?: () => void
}) {
  const message = error instanceof Error ? error.message : undefined
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="h-8 w-8" />
      </span>
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold tracking-tight">Something went wrong</h1>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          GeoFix hit an unexpected error. Your data is safe — try again or reload the app.
        </p>
        {message && (
          <p className="mx-auto mt-3 max-w-md truncate rounded-lg bg-muted px-3 py-2 font-mono text-[11px] text-destructive">
            {message}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {resetErrorBoundary && (
          <Button onClick={resetErrorBoundary} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Try again
          </Button>
        )}
        <Button variant="outline" onClick={() => window.location.reload()} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Reload app
        </Button>
      </div>
    </div>
  )
}