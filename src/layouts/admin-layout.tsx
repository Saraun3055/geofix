import { Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ShieldCheck, ListChecks, Scale, Users, ScrollText, UserRound } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { useAuthStore } from '@/stores/auth'
import { useVerificationQueue, useActiveRequestsStats } from '@/hooks/use-admin'

export default function AdminLayout() {
  const name = useAuthStore((s) => s.name) ?? 'Admin'
  const adminRole = useAuthStore((s) => s.adminRole)
  const signOut = useAuthStore((s) => s.signOut)
  const navigate = useNavigate()

  const queue = useVerificationQueue()
  const stats = useActiveRequestsStats()

  return (
    <AppShell
      portal="admin"
      variant="operations"
      userName={name}
      userSub={adminRole ?? 'Platform operator'}
      onSignOut={() => {
        signOut()
        navigate('/')
      }}
      navItems={[
        { to: '/admin/overview', label: 'Overview', icon: LayoutDashboard, end: true },
        { to: '/admin/verification', label: 'Verification queue', icon: ShieldCheck, badge: queue.data?.length ?? 0 },
        { to: '/admin/requests', label: 'All requests', icon: ListChecks, badge: stats.data?.total },
        { to: '/admin/disputes', label: 'Disputes', icon: Scale },
        { to: '/admin/users', label: 'Users', icon: Users },
        { to: '/admin/audit', label: 'Audit log', icon: ScrollText },
        { to: '/admin/profile', label: 'Profile', icon: UserRound },
      ]}
    >
      <Outlet />
    </AppShell>
  )
}