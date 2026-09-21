import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react'
import { useToastStore } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const ICONS = {
  info: Info,
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
}

const STYLES = {
  info: 'border-stone-200 text-stone-600',
  success: 'border-sage-200 text-sage-700',
  error: 'border-rust-300 text-rust-800',
  warning: 'border-caramel-200 text-caramel-700',
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismissToast)

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const Icon = ICONS[t.type ?? 'info']
        return (
          <div
            key={t.id}
            className={cn(
              'paper-card pointer-events-auto flex items-start gap-3 px-4 py-3 animate-list-in',
              STYLES[t.type ?? 'info'],
            )}
          >
            <Icon width={18} height={18} className="mt-0.5 shrink-0" />
            <div className="flex-1 text-sm">
              {t.title && <p className="font-semibold">{t.title}</p>}
              <p className="text-muted-foreground">{t.message}</p>
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded p-0.5 opacity-50 hover:opacity-100 cursor-pointer"
              aria-label="Dismiss"
            >
              <X width={14} height={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
