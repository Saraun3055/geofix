import { getDemoStore, persistDemoStore } from '@/lib/demo'
import { isLocalApi } from '@/lib/mode'
import { updateWorkerProfileApi } from '@/services/local-api'
import type { AvailabilitySlot } from '@/lib/types'

export async function updateWorkerProfile(
  userId: string,
  data: { categorySkills: string[]; availableSlots: AvailabilitySlot[] },
): Promise<boolean> {
  if (isLocalApi) {
    try {
      await updateWorkerProfileApi(userId, data)
      return true
    } catch {
      return false
    }
  }

  const store = getDemoStore()
  const worker = store.workers.find((w) => w.userId === userId)
  if (!worker) return false
  worker.categorySkills = [...new Set(data.categorySkills.map((s) => s.trim()).filter(Boolean))]
  worker.availableSlots = data.availableSlots.filter((s) => s.day && s.from && s.to)
  persistDemoStore(store)
  return true
}