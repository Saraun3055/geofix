type RouteKey =
  | 'landing'
  | 'login'
  | 'signup'
  | 'forgotPassword'
  | 'resetPassword'
  | 'customerLayout'
  | 'customerDashboard'
  | 'customerNewRequest'
  | 'customerWorkers'
  | 'customerLiveStatus'
  | 'customerRate'
  | 'customerComplaint'
  | 'customerProfile'
  | 'workerLayout'
  | 'workerDashboard'
  | 'workerIncoming'
  | 'workerJobs'
  | 'workerVerification'
  | 'workerProfile'
  | 'adminLayout'
  | 'adminOverview'
  | 'adminVerification'
  | 'adminRequests'
  | 'adminDisputes'
  | 'adminUsers'
  | 'adminAuditLog'
  | 'adminProfile'

const routes: Record<RouteKey, () => Promise<unknown>> = {
  landing: () => import('@/pages/landing'),
  login: () => import('@/pages/auth/login'),
  signup: () => import('@/pages/auth/signup'),
  forgotPassword: () => import('@/pages/auth/forgot-password'),
  resetPassword: () => import('@/pages/auth/reset-password'),
  customerLayout: () => import('@/layouts/customer-layout'),
  customerDashboard: () => import('@/pages/customer/dashboard'),
  customerNewRequest: () => import('@/pages/customer/new-request'),
  customerWorkers: () => import('@/pages/customer/workers'),
  customerLiveStatus: () => import('@/pages/customer/live-status'),
  customerRate: () => import('@/pages/customer/rate'),
  customerComplaint: () => import('@/pages/customer/complaint'),
  customerProfile: () => import('@/pages/customer/profile'),
  workerLayout: () => import('@/layouts/worker-layout'),
  workerDashboard: () => import('@/pages/worker/dashboard'),
  workerIncoming: () => import('@/pages/worker/incoming'),
  workerJobs: () => import('@/pages/worker/jobs'),
  workerVerification: () => import('@/pages/worker/verification'),
  workerProfile: () => import('@/pages/worker/profile'),
  adminLayout: () => import('@/layouts/admin-layout'),
  adminOverview: () => import('@/pages/admin/overview'),
  adminVerification: () => import('@/pages/admin/verification'),
  adminRequests: () => import('@/pages/admin/requests'),
  adminDisputes: () => import('@/pages/admin/disputes'),
  adminUsers: () => import('@/pages/admin/users'),
  adminAuditLog: () => import('@/pages/admin/audit-log'),
  adminProfile: () => import('@/pages/admin/profile'),
}

const inFlight = new Set<RouteKey>()

export function prefetchRoute(key: RouteKey): void {
  if (inFlight.has(key)) return
  const load = routes[key]
  if (!load) return
  inFlight.add(key)
  Promise.resolve()
    .then(load)
    .catch(() => {
      inFlight.delete(key)
    })
}

const pathPrefixMap = {
  '/customer/new/workers': 'customerWorkers',
  '/customer/new': 'customerNewRequest',
  '/customer/rate': 'customerRate',
  '/customer/complaint': 'customerComplaint',
  '/customer/requests': 'customerLiveStatus',
  '/customer/dashboard': 'customerDashboard',
  '/customer/profile': 'customerProfile',
  '/customer': 'customerLayout',
  '/worker/verification': 'workerVerification',
  '/worker/incoming': 'workerIncoming',
  '/worker/jobs': 'workerJobs',
  '/worker/profile': 'workerProfile',
  '/worker/dashboard': 'workerDashboard',
  '/worker': 'workerLayout',
  '/admin/verification': 'adminVerification',
  '/admin/requests': 'adminRequests',
  '/admin/disputes': 'adminDisputes',
  '/admin/users': 'adminUsers',
  '/admin/audit': 'adminAuditLog',
  '/admin/profile': 'adminProfile',
  '/admin/overview': 'adminOverview',
  '/admin': 'adminLayout',
  '/forgot-password': 'forgotPassword',
  '/reset-password': 'resetPassword',
  '/signup': 'signup',
  '/login': 'login',
  '/': 'landing',
} satisfies Record<string, RouteKey>

const pathPrefixes = Object.entries(pathPrefixMap).sort((a, b) => b[0].length - a[0].length)

export function prefetchByPath(path: string): void {
  for (const [prefix, key] of pathPrefixes) {
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      prefetchRoute(key)
      return
    }
  }
}

const portalGroups: Record<'customer' | 'worker' | 'admin', RouteKey[]> = {
  customer: [
    'customerLayout',
    'customerDashboard',
    'customerNewRequest',
    'customerWorkers',
    'customerLiveStatus',
    'customerRate',
    'customerComplaint',
    'customerProfile',
  ],
  worker: ['workerLayout', 'workerDashboard', 'workerIncoming', 'workerJobs', 'workerVerification', 'workerProfile'],
  admin: [
    'adminLayout',
    'adminOverview',
    'adminVerification',
    'adminRequests',
    'adminDisputes',
    'adminUsers',
    'adminAuditLog',
    'adminProfile',
  ],
}

export function prefetchPortal(portal: 'customer' | 'worker' | 'admin', delay = 0): void {
  const keys = portalGroups[portal]
  if (delay > 0) {
    window.setTimeout(() => keys.forEach(prefetchRoute), delay)
  } else {
    keys.forEach(prefetchRoute)
  }
}