import { useQuery } from '@tanstack/react-query'
import { getDemoStore } from '@/lib/demo'
import { dataMode } from '@/lib/mode'
import {
  getVerificationQueue,
  getDisputes,
  getAuditLog,
  getAllApiUsers,
  getActiveStats,
  getRatingDistribution,
} from '@/services/local-api'
import type {
  VerificationQueueDoc,
  DisputeDoc,
  AuditLogDoc,
  UserDoc,
} from '@/lib/types'

const isDemo = dataMode === 'demo'
const isLocalApi = dataMode === 'local-api'

export function useVerificationQueue() {
  return useQuery({
    queryKey: ['verificationQueue'],
    queryFn: async (): Promise<VerificationQueueDoc[]> => {
      if (isLocalApi) return getVerificationQueue()
      return getDemoStore().verificationQueue.filter((v) => v.status === 'pending')
    },
    refetchInterval: isDemo || isLocalApi ? 5000 : false,
  })
}

export function useDisputes(statusFilter?: 'open' | 'resolved' | '') {
  return useQuery({
    queryKey: ['disputes', statusFilter],
    queryFn: async (): Promise<DisputeDoc[]> => {
      if (isLocalApi) return getDisputes(statusFilter)
      const store = getDemoStore()
      return statusFilter
        ? store.disputes.filter((d) => d.status === statusFilter).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        : [...store.disputes].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },
    refetchInterval: isDemo || isLocalApi ? 5000 : false,
  })
}

export function useAuditLog() {
  return useQuery({
    queryKey: ['auditLog'],
    queryFn: async (): Promise<AuditLogDoc[]> => {
      if (isLocalApi) return getAuditLog()
      return [...getDemoStore().audit].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    },
    refetchInterval: isDemo || isLocalApi ? 5000 : false,
  })
}

export function useAllUsers() {
  return useQuery({
    queryKey: ['allUsers'],
    queryFn: async (): Promise<UserDoc[]> => {
      if (isLocalApi) return getAllApiUsers()
      const store = getDemoStore()
      const customers = store.requests
        .map((r) => r.customerId)
        .filter((v, i, a) => a.indexOf(v) === i)
        .map((id) => ({
          uid: id,
          name: id === 'c0' ? 'Aisha Patel' : `Customer ${id.replace('c', '')}`,
          email: `${id}@example.com`,
          role: 'customer' as const,
          createdAt: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
        }))
      const workers: UserDoc[] = store.workers.map((w) => ({
        uid: w.userId,
        name: w.name,
        phone: w.phone,
        role: 'worker' as const,
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 60).toISOString(),
      }))
      return [...customers, ...workers].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },
    refetchInterval: isDemo || isLocalApi ? 5000 : false,
  })
}

export function useActiveRequestsStats() {
  return useQuery({
    queryKey: ['activeRequestsStats'],
    queryFn: async () => {
      if (isLocalApi) return getActiveStats()
      const store = getDemoStore()
      const active = store.requests.filter((r) =>
        ['searching', 'pending_worker_response', 'accepted', 'on_the_way', 'arrived', 'in_progress'].includes(r.status),
      )
      return {
        total: active.length,
        searching: active.filter((r) => r.status === 'searching').length,
        pending: active.filter((r) => r.status === 'pending_worker_response').length,
        accepted: active.filter((r) =>
          ['accepted', 'on_the_way', 'arrived', 'in_progress'].includes(r.status),
        ).length,
      }
    },
    refetchInterval: isDemo || isLocalApi ? 3000 : 10000,
  })
}

export function useRatingDistribution() {
  return useQuery({
    queryKey: ['ratingDistribution'],
    queryFn: async () => {
      if (isLocalApi) return getRatingDistribution()
      const store = getDemoStore()
      const dist = [0, 0, 0, 0, 0]
      store.ratings.forEach((r) => {
        if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++
      })
      return dist.map((count, i) => ({ stars: i + 1, count }))
    },
  })
}