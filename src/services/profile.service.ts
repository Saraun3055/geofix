import { getDemoStore, persistDemoStore, getDemoAuthUser, setDemoAuthUser } from '@/lib/demo'
import { isLocalApi } from '@/lib/mode'
import { updateMyProfileApi } from '@/services/local-api'
import { useAuthStore } from '@/stores/auth'

export type ProfileEdits = { name?: string; phone?: string }

/** Update the signed-in user's display name / phone, in both data modes. */
export async function updateMyProfile(data: ProfileEdits): Promise<boolean> {
  if (isLocalApi) {
    const user = await updateMyProfileApi(data)
    if (!user) return false
    useAuthStore.getState().applyProfile(user.name, user.phone ?? '')
    return true
  }

  const authUser = getDemoAuthUser()
  if (!authUser) return false

  const nextName = (data.name?.trim() || authUser.name).trim()
  const nextPhone = (data.phone?.trim() || authUser.phone || '').trim()
  const next = { ...authUser, name: nextName, phone: nextPhone || authUser.phone }
  setDemoAuthUser(next)

  if (authUser.role === 'worker') {
    const store = getDemoStore()
    const worker = store.workers.find((w) => w.userId === authUser.uid)
    if (worker) {
      worker.name = nextName
      if (nextPhone) worker.phone = nextPhone
      persistDemoStore(store)
    }
  }

  useAuthStore.getState().applyProfile(next.name, next.phone)
  return true
}