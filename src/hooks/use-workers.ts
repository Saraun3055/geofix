import { useQuery } from '@tanstack/react-query'
import { getDemoStore } from '@/lib/demo'
import { dataMode } from '@/lib/mode'
import { nearbyWorkers, getWorkerProfile, getAllWorkers } from '@/services/local-api'
import type { WorkerProfileDoc, GeoPointLike, ServiceCategory } from '@/lib/types'
import { haversine } from '@/lib/geo'

export function useNearbyWorkers(
  center: GeoPointLike | null,
  radiusKm: number = 25,
  excludeIds: string[] = [],
  enabled: boolean = true,
  category?: ServiceCategory | null,
) {
  const isDemo = dataMode === 'demo'
  const isLocalApi = dataMode === 'local-api'
  const categoryKey = category?.toLowerCase() ?? null
  const matchesCategory = (skills: string[] | undefined) =>
    !categoryKey || (skills ?? []).some((s) => s.toLowerCase() === categoryKey)

  return useQuery({
    queryKey: ['nearbyWorkers', center?.latitude, center?.longitude, radiusKm, excludeIds.join(','), categoryKey ?? 'all'],
    enabled: enabled && !!center,
    queryFn: async (): Promise<WorkerProfileDoc[]> => {
      if (isLocalApi && center) {
        return nearbyWorkers({
          lat: center.latitude,
          lng: center.longitude,
          radiusKm,
          category,
          excludeIds,
        })
      }

      // Demo mode: simulate geo sorting by distance + rating, scoped to category
      const store = getDemoStore()
      const onlineWorkers = store.workers.filter(
        (w) =>
          w.isOnline &&
          w.verificationStatus === 'approved' &&
          !excludeIds.includes(w.userId) &&
          matchesCategory(w.categorySkills),
      )
      if (center) {
        return onlineWorkers
          .map((w) => ({
            ...w,
            _distance: haversine(center, { latitude: w.g.geopoint.latitude, longitude: w.g.geopoint.longitude }),
          }))
          .filter((w) => w._distance <= radiusKm * 1000)
          .sort((a, b) => (b.rating - a.rating) || (a._distance ?? 0) - (b._distance ?? 0))
      }
      return onlineWorkers.sort((a, b) => b.rating - a.rating)
    },
    refetchInterval: isDemo || isLocalApi ? 3000 : false,
  })
}

export function useWorkerProfile(userId: string | null | undefined) {
  const isDemo = dataMode === 'demo'
  const isLocalApi = dataMode === 'local-api'
  return useQuery({
    queryKey: ['workerProfile', userId],
    enabled: !!userId,
    queryFn: async (): Promise<WorkerProfileDoc | null> => {
      if (!userId) return null
      if (isLocalApi) return getWorkerProfile(userId)
      const store = getDemoStore()
      return store.workers.find((w) => w.userId === userId) ?? null
    },
    refetchInterval: isDemo || isLocalApi ? 5000 : false,
  })
}

export function useAllWorkers() {
  const isDemo = dataMode === 'demo'
  const isLocalApi = dataMode === 'local-api'
  return useQuery({
    queryKey: ['allWorkers'],
    queryFn: async (): Promise<WorkerProfileDoc[]> => {
      if (isLocalApi) return getAllWorkers()
      const store = getDemoStore()
      return [...store.workers].sort((a, b) => b.rating - a.rating)
    },
    refetchInterval: isDemo || isLocalApi ? 5000 : false,
  })
}