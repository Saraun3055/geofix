import { useQuery } from '@tanstack/react-query'
import { getDemoStore } from '@/lib/demo'
import { dataMode } from '@/lib/mode'
import { getMyRequests, getWorkerIncoming, getWorkerJobs, getRequestById, getAllRequests } from '@/services/local-api'
import type { ServiceRequestDoc, RequestStatus } from '@/lib/types'

export function useMyRequests(customerId: string | null | undefined) {
  const isDemo = dataMode === 'demo'
  const isLocalApi = dataMode === 'local-api'
  const queryKey = ['myRequests', customerId]
  const queryFn = async (): Promise<ServiceRequestDoc[]> => {
    if (isLocalApi && customerId) return getMyRequests(customerId)
    const store = getDemoStore()
    return store.requests
      .filter((r) => r.customerId === customerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
  return useQuery({
    queryKey,
    queryFn,
    enabled: !!customerId,
    refetchInterval: isDemo || isLocalApi ? 2000 : false,
  })
}

export function useWorkerIncoming(workerId: string | null | undefined) {
  const isDemo = dataMode === 'demo'
  const isLocalApi = dataMode === 'local-api'
  const queryKey = ['workerIncoming', workerId]
  const queryFn = async (): Promise<ServiceRequestDoc[]> => {
    if (isLocalApi && workerId) return getWorkerIncoming(workerId)
    const store = getDemoStore()
    return store.requests.filter((r) => r.workerId === workerId && r.status === 'pending_worker_response')
  }
  return useQuery({
    queryKey,
    queryFn,
    enabled: !!workerId,
    refetchInterval: isDemo || isLocalApi ? 2000 : false,
  })
}

export function useWorkerJobs(workerId: string | null | undefined) {
  const isDemo = dataMode === 'demo'
  const isLocalApi = dataMode === 'local-api'
  const queryKey = ['workerJobs', workerId]
  const queryFn = async (): Promise<ServiceRequestDoc[]> => {
    if (isLocalApi && workerId) return getWorkerJobs(workerId)
    const store = getDemoStore()
    return store.requests
      .filter((r) => r.workerId === workerId && ['accepted', 'completed'].includes(r.status))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
  return useQuery({
    queryKey,
    queryFn,
    enabled: !!workerId,
    refetchInterval: isDemo || isLocalApi ? 2000 : false,
  })
}

/** Live single-request feed. Polls in demo/local-api mode. */
export function useRequestLive(requestId: string | null | undefined) {
  const isDemo = dataMode === 'demo'
  const isLocalApi = dataMode === 'local-api'
  const queryKey = ['requestLive', requestId]
  const queryFn = async (): Promise<ServiceRequestDoc | null> => {
    if (!requestId) return null
    if (isLocalApi) return getRequestById(requestId)
    const store = getDemoStore()
    return store.requests.find((r) => r.id === requestId) ?? null
  }
  return useQuery({
    queryKey,
    queryFn,
    enabled: !!requestId,
    refetchInterval: isDemo || isLocalApi ? 2000 : false,
  })
}

export function useAllRequests(statusFilter?: RequestStatus | '') {
  const isDemo = dataMode === 'demo'
  const isLocalApi = dataMode === 'local-api'
  const queryKey = ['allRequests', statusFilter ?? 'all']
  const queryFn = async (): Promise<ServiceRequestDoc[]> => {
    if (isLocalApi) return getAllRequests(statusFilter ?? undefined)
    const store = getDemoStore()
    const list = statusFilter ? store.requests.filter((r) => r.status === statusFilter) : store.requests
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
  return useQuery({
    queryKey,
    queryFn,
    refetchInterval: isDemo || isLocalApi ? 3000 : false,
  })
}