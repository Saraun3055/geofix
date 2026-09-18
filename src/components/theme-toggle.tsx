import { Moon, Sun } from 'lucide-react'
import { setTheme, useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

export function ThemeToggle({
  tone = 'default',
  className,
}: {
  tone?: 'default' | 'sidebar'
  className?: string
}) {
  const theme = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'relative inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer',
        tone === 'sidebar'
          ? 'border-sidebar-border bg-sidebar-accent/50 text-sidebar-foreground/70 hover:border-sidebar-ring/60 hover:text-sidebar-foreground'
          : 'border-border/70 bg-secondary/40 text-muted-foreground hover:border-primary/40 hover:text-foreground',
        className,
      )}
    >
      <Sun
        className={cn(
          'absolute h-4 w-4 transition-all duration-300',
          isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100',
        )}
      />
      <Moon
        className={cn(
          'absolute h-4 w-4 transition-all duration-300',
          isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0',
        )}
      />
    </button>
  )
}