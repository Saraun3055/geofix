import { useQuery } from '@tanstack/react-query'
import { getDemoStore } from '@/lib/demo'
import { dataMode } from '@/lib/mode'
import { getRatingsForWorker } from '@/services/local-api'
import type { RatingDoc } from '@/lib/types'

export function useRatingsForWorker(workerId: string | null | undefined) {
  const isDemo = dataMode === 'demo'
  const isLocalApi = dataMode === 'local-api'
  return useQuery({
    queryKey: ['ratingsForWorker', workerId],
    enabled: !!workerId,
    queryFn: async (): Promise<RatingDoc[]> => {
      if (isLocalApi && workerId) return getRatingsForWorker(workerId)
      return getDemoStore().ratings.filter((r) => r.workerId === workerId)
    },
    refetchInterval: isDemo || isLocalApi ? 3000 : false,
  })
}