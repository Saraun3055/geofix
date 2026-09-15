import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/toaster'
import { useAuthInit } from '@/hooks/use-auth'
import { ProtectedRoute, RoleRoute, AdminRoute, RoleRedirect } from '@/components/guards'

import Landing from '@/pages/landing'
import LoginPage from '@/pages/auth/login'
import SignupPage from '@/pages/auth/signup'

import CustomerLayout from '@/layouts/customer-layout'
import CustomerDashboard from '@/pages/customer/dashboard'
import CustomerNewRequest from '@/pages/customer/new-request'
import CustomerWorkers from '@/pages/customer/workers'
import CustomerLiveStatus from '@/pages/customer/live-status'
import CustomerRate from '@/pages/customer/rate'
import CustomerComplaint from '@/pages/customer/complaint'
import CustomerProfile from '@/pages/customer/profile'

import WorkerLayout from '@/layouts/worker-layout'
import WorkerDashboard from '@/pages/worker/dashboard'
import WorkerIncoming from '@/pages/worker/incoming'
import WorkerJobs from '@/pages/worker/jobs'
import WorkerVerification from '@/pages/worker/verification'
import WorkerProfile from '@/pages/worker/profile'

import AdminLayout from '@/layouts/admin-layout'
import AdminOverview from '@/pages/admin/overview'
import AdminVerification from '@/pages/admin/verification'
import AdminRequests from '@/pages/admin/requests'
import AdminDisputes from '@/pages/admin/disputes'
import AdminUsers from '@/pages/admin/users'
import AdminAuditLog from '@/pages/admin/audit-log'
import AdminProfile from '@/pages/admin/profile'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
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
  )
}

export default function App() {
  useAuthInit()
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  )
}