import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, PlusCircle, UserRound } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { useAuthStore } from '@/stores/auth'

export default function CustomerLayout() {
  const name = useAuthStore((s) => s.name) ?? 'Customer'
  const signOut = useAuthStore((s) => s.signOut)
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <AppShell
      portal="customer"
      userName={name}
      userSub="Customer portal"
      onSignOut={() => {
        signOut()
        navigate('/')
      }}
      navItems={[
        { to: '/customer/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
        { to: '/customer/new', label: 'New request', icon: PlusCircle },
        { to: '/customer/profile', label: 'Profile', icon: UserRound },
      ]}
    >
      <div key={location.pathname} className="animate-stagger-in">
        <Outlet />
      </div>
    </AppShell>
  )
}