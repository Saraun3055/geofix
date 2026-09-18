import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Menu, X, LogOut, ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { LogoFull, Logo } from '@/components/logo'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  badge?: number
}

export function AppShell({
  portal,
  navItems,
  navFooter,
  userName,
  userSub,
  onSignOut,
  variant = 'warm',
  className,
  children,
}: {
  portal: 'customer' | 'worker' | 'admin'
  navItems: NavItem[]
  navFooter?: NavItem[]
  userName: string
  userSub?: string
  onSignOut: () => void
  variant?: 'warm' | 'operations'
  className?: string
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const portalScope =
    portal === 'worker' ? 'portal-worker' : portal === 'admin' ? 'portal-admin' : 'portal-customer'

  const initials = userName
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const SidebarContent = (
    <>
      <div className="flex items-center gap-2 px-5 pt-5 pb-4">
        <Logo size={30} />
        <div>
          <span className="font-display text-lg font-semibold leading-none text-sidebar-foreground">
            Geo<span className="text-sidebar-primary">Fix</span>
          </span>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-sidebar-foreground/45">
            {portal} portal
          </p>
        </div>
      </div>

      <nav className="mt-3 flex-1 space-y-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
              )
            }
          >
            <item.icon className="h-[18px] w-[18px] stroke-[1.7] transition-transform duration-200 group-hover:scale-110" />
            <span className="flex-1">{item.label}</span>
            {item.badge ? (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 font-mono text-[10px] leading-none',
                  variant === 'operations' ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'bg-primary text-primary-foreground',
                )}
              >
                {item.badge}
              </span>
            ) : null}
          </NavLink>
        ))}

        {navFooter && (
          <>
            <div className="py-2">
              <div className="mx-3 border-t border-sidebar-border" />
            </div>
            {navFooter.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                  )
                }
              >
                <item.icon className="h-[18px] w-[18px] stroke-[1.7] transition-transform duration-200 group-hover:scale-110" />
                <span className="flex-1">{item.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="p-3">
        <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent/70 px-3 py-2.5 transition-all duration-200 hover:scale-[1.01] hover:bg-sidebar-accent">
          <Avatar className="h-9 w-9 border border-sidebar-border">
            <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-foreground">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-sidebar-foreground">{userName}</p>
            {userSub && <p className="truncate text-[11px] text-sidebar-foreground/50">{userSub}</p>}
          </div>
          <button
            onClick={onSignOut}
            className="text-sidebar-foreground/50 transition-colors hover:text-sidebar-foreground cursor-pointer"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className={cn(portalScope, 'flex min-h-screen bg-background text-foreground', className)}>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-sidebar text-sidebar-foreground lg:flex',
          variant === 'operations' && 'shadow-[inset_-1px_0_0_var(--sidebar-border)]',
        )}
      >
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar text-sidebar-foreground animate-in">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded p-1 text-sidebar-foreground/60 hover:text-sidebar-foreground cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border/70 bg-background/85 px-4 backdrop-blur lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 transition-transform hover:bg-muted active:scale-95 cursor-pointer" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <LogoFull size={26} className="text-foreground" textClassName="text-base" />
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <MobileBreadcrumb navItems={navItems} />
          {children}
        </main>

        <footer className="px-4 pb-6 pt-2 text-center text-xs text-muted-foreground/70 lg:px-8">
          GeoFix · {portal} portal · Data stays in sync with the mobile app
        </footer>
      </div>
    </div>
  )
}

function MobileBreadcrumb({ navItems }: { navItems: NavItem[] }) {
  const location = useLocation()
  const current = navItems.find((n) =>
    n.to === '/' ? false : location.pathname.startsWith(n.to),
  )
  if (!current || location.pathname === '/') return null
  return (
    <div
      className={cn(
        'mb-4 flex items-center gap-1 text-sm text-muted-foreground',
        'hidden lg:flex',
      )}
    >
      <span className="font-medium capitalize">{current.label}</span>
      <ChevronRight className="h-3.5 w-3.5 opacity-50" />
    </div>
  )
}