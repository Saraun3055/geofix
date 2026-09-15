import { Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Inbox, History, BadgeCheck, UserRound } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { useAuthStore } from '@/stores/auth'
import { useWorkerIncoming } from '@/hooks/use-requests'
import { useWorkerProfile } from '@/hooks/use-workers'

export default function WorkerLayout() {
  const uid = useAuthStore((s) => s.uid)
  const name = useAuthStore((s) => s.name) ?? 'Worker'
  const signOut = useAuthStore((s) => s.signOut)
  const navigate = useNavigate()
  const profile = useWorkerProfile(uid)
  const incoming = useWorkerIncoming(uid)

  const pendingCount = incoming.data?.length ?? 0

  return (
    <AppShell
      portal="worker"
      variant="warm"
      userName={profile.data?.name ?? name}
      userSub={profile.data?.isOnline ? '● Online' : '○ Offline'}
      onSignOut={() => {
        signOut()
        navigate('/')
      }}
      navItems={[
        { to: '/worker/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
        { to: '/worker/incoming', label: 'Incoming', icon: Inbox, badge: pendingCount },
        { to: '/worker/jobs', label: 'Job history', icon: History },
        { to: '/worker/verification', label: 'Verification', icon: BadgeCheck },
        { to: '/worker/profile', label: 'Profile', icon: UserRound },
      ]}
    >
      <Outlet />
    </AppShell>
  )
}