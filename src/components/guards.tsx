import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { Spinner } from '@/components/ui/spinner'

export function ProtectedRoute() {
  const status = useAuthStore((s) => s.status)
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center text-primary">
        <Spinner size={32} />
      </div>
    )
  }
  if (status === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  return <Outlet />
}

export function RoleRoute({ role }: { role: 'customer' | 'worker' }) {
  const currentRole = useAuthStore((s) => s.role)
  if (currentRole !== role) return <Navigate to={currentRole === 'worker' ? '/worker' : '/customer'} replace />
  return <Outlet />
}

export function AdminRoute() {
  const role = useAuthStore((s) => s.role)
  if (role !== 'admin') return <Navigate to="/" replace />
  return <Outlet />
}

export function RoleRedirect() {
  const role = useAuthStore((s) => s.role)
  if (role === 'customer') return <Navigate to="/customer" replace />
  if (role === 'worker') return <Navigate to="/worker" replace />
  if (role === 'admin') return <Navigate to="/admin" replace />
  return <Navigate to="/" replace />
}