import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'
import { Toaster } from '@/components/toaster'
import { useAuthInit } from '@/hooks/use-auth'
import { ProtectedRoute, RoleRoute, AdminRoute, RoleRedirect } from '@/components/guards'
import { ErrorFallback } from '@/components/error-fallback'
import { LoadingSpinner } from '@/components/loading-spinner'
import { prefetchRoute } from '@/lib/prefetch'

const Landing = lazy(() => import('@/pages/landing'))
const LoginPage = lazy(() => import('@/pages/auth/login'))
const SignupPage = lazy(() => import('@/pages/auth/signup'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/forgot-password'))
const ResetPasswordPage = lazy(() => import('@/pages/auth/reset-password'))

const CustomerLayout = lazy(() => import('@/layouts/customer-layout'))
const CustomerDashboard = lazy(() => import('@/pages/customer/dashboard'))
const CustomerNewRequest = lazy(() => import('@/pages/customer/new-request'))
const CustomerWorkers = lazy(() => import('@/pages/customer/workers'))
const CustomerLiveStatus = lazy(() => import('@/pages/customer/live-status'))
const CustomerRate = lazy(() => import('@/pages/customer/rate'))
const CustomerComplaint = lazy(() => import('@/pages/customer/complaint'))
const CustomerProfile = lazy(() => import('@/pages/customer/profile'))

const WorkerLayout = lazy(() => import('@/layouts/worker-layout'))
const WorkerDashboard = lazy(() => import('@/pages/worker/dashboard'))
const WorkerIncoming = lazy(() => import('@/pages/worker/incoming'))
const WorkerJobs = lazy(() => import('@/pages/worker/jobs'))
const WorkerVerification = lazy(() => import('@/pages/worker/verification'))
const WorkerProfile = lazy(() => import('@/pages/worker/profile'))

const AdminLayout = lazy(() => import('@/layouts/admin-layout'))
const AdminOverview = lazy(() => import('@/pages/admin/overview'))
const AdminVerification = lazy(() => import('@/pages/admin/verification'))
const AdminRequests = lazy(() => import('@/pages/admin/requests'))
const AdminDisputes = lazy(() => import('@/pages/admin/disputes'))
const AdminUsers = lazy(() => import('@/pages/admin/users'))
const AdminAuditLog = lazy(() => import('@/pages/admin/audit-log'))
const AdminProfile = lazy(() => import('@/pages/admin/profile'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function AppRoutes() {
  const location = useLocation()
  return (
    <div key={location.pathname} className="animate-fade-in">
      <Routes location={location}>
      <Route path="/" element={<Landing />} />

      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/portal" element={<RoleRedirect />} />

      {/* Customer portal */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute role="customer" />}>
          <Route path="/customer" element={<CustomerLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<CustomerDashboard />} />
            <Route path="new" element={<CustomerNewRequest />} />
            <Route path="new/workers" element={<CustomerWorkers />} />
            <Route path="requests/:id" element={<CustomerLiveStatus />} />
            <Route path="rate/:id" element={<CustomerRate />} />
            <Route path="complaint/:id" element={<CustomerComplaint />} />
            <Route path="profile" element={<CustomerProfile />} />
          </Route>
        </Route>

        {/* Worker portal */}
        <Route element={<RoleRoute role="worker" />}>
          <Route path="/worker" element={<WorkerLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<WorkerDashboard />} />
            <Route path="incoming" element={<WorkerIncoming />} />
            <Route path="jobs" element={<WorkerJobs />} />
            <Route path="verification" element={<WorkerVerification />} />
            <Route path="profile" element={<WorkerProfile />} />
          </Route>
        </Route>

        {/* Admin portal */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<AdminOverview />} />
            <Route path="verification" element={<AdminVerification />} />
            <Route path="requests" element={<AdminRequests />} />
            <Route path="disputes" element={<AdminDisputes />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="audit" element={<AdminAuditLog />} />
            <Route path="profile" element={<AdminProfile />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  useAuthInit()

  useEffect(() => {
    const t = window.setTimeout(() => {
      prefetchRoute('login')
      prefetchRoute('signup')
    }, 800)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={<LoadingSpinner />}>
            <AppRoutes />
          </Suspense>
        </ErrorBoundary>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  )
}