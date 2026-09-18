import { Link } from 'react-router-dom'
import { Logo } from '@/components/logo'
import { Stars } from '@/components/stars'
import { ThemeToggle } from '@/components/theme-toggle'

export function AuthShell({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="geo-grid relative flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-border shadow-2xl animate-in lg:grid-cols-[1fr_1.1fr]">
        {/* Brand panel */}
        <div className="relative hidden overflow-hidden bg-foreground p-10 text-background lg:flex lg:flex-col">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-accent/30 blur-3xl" />
          <Link to="/" className="relative z-10 flex items-center gap-2">
            <Logo size={30} />
            <span className="font-display text-xl font-semibold">
              Geo<span className="text-primary">Fix</span>
            </span>
          </Link>
          <div className="relative z-10 mt-auto pb-4">
            <blockquote className="font-display text-2xl font-semibold leading-snug">
              "Madurai's trusted home repair network. Connected instantly via WhatsApp."
            </blockquote>
            <div className="mt-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/25 font-display text-sm font-bold">
                AP
              </span>
              <div>
                <p className="text-sm font-medium">Aisha Patel</p>
                <div className="flex items-center gap-1.5 text-xs text-background/60">
                  <Stars value={5} size={12} /> Verified customer
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="bg-card p-7 sm:p-10">
          <div className="lg:hidden">
            <Link to="/" className="mb-6 inline-flex items-center gap-2">
              <Logo size={26} />
              <span className="font-display text-lg font-semibold">
                Geo<span className="text-primary">Fix</span>
              </span>
            </Link>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">{title ?? 'Welcome back'}</h1>
          {children}
        </div>
      </div>
    </div>
  )
}

export function DemoQuickLogin({
  onSelect,
}: {
  onSelect: (role: 'customer' | 'worker' | 'admin') => void
}) {
  return (
    <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/40 p-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        Try it instantly · demo mode
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        No Firebase keys configured, so this build ships with seeded sample data. Explore any portal in one click.
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {(
          [
            ['customer', 'Customer'],
            ['worker', 'Worker'],
            ['admin', 'Admin'],
          ] as const
        ).map(([role, label]) => (
          <button
            key={role}
            onClick={() => onSelect(role)}
            className="rounded-lg border border-border bg-background px-2 py-2 text-xs font-semibold transition-colors hover:border-primary hover:text-primary cursor-pointer"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}