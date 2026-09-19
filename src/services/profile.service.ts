import { getDemoStore, persistDemoStore, getDemoAuthUser, setDemoAuthUser } from '@/lib/demo'
import { isLocalApi } from '@/lib/mode'
import { updateMyProfileApi } from '@/services/local-api'
import { useAuthStore } from '@/stores/auth'

export type ProfileEdits = { name?: string; phone?: string; pincode?: string; area?: string }

/** Update the signed-in user's display name / phone, in both data modes. */
export async function updateMyProfile(data: ProfileEdits): Promise<boolean> {
  if (isLocalApi) {
    const user = await updateMyProfileApi(data)
    if (!user) return false
    useAuthStore.getState().applyProfile(user.name, user.phone ?? '', {
      pincode: user.pincode ?? null,
      area: user.area ?? null,
    })
    return true
  }

  const authUser = getDemoAuthUser()
  if (!authUser) return false

  const nextName = (data.name?.trim() || authUser.name).trim()
  const nextPhone = (data.phone?.trim() || authUser.phone || '').trim()
  const next = {
    ...authUser,
    name: nextName,
    phone: nextPhone || authUser.phone,
    pincode: data.pincode ?? authUser.pincode,
    area: data.area ?? authUser.area,
  }
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

  useAuthStore.getState().applyProfile(next.name, next.phone, {
    pincode: next.pincode ?? null,
    area: next.area ?? null,
  })
  return true
}