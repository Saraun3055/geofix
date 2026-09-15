import { getDemoStore, persistDemoStore } from '@/lib/demo'
import { isLocalApi } from '@/lib/mode'
import { submitWorkerVerification as localSubmitWorkerVerification } from '@/services/local-api'
import { uploadPhoto } from '@/lib/storage'
import { toastError, toastSuccess } from '@/hooks/use-toast'

export async function submitVerification(
  workerId: string,
  name: string,
  file: File,
): Promise<boolean> {
  try {
    if (isLocalApi) {
      // No storage on the local API: encode the ID photo as a data URL (same
      // behaviour as demo mode) and post it to the Express backend.
      const url = await uploadPhoto(file, `verification/${workerId}`)
      const ok = await localSubmitWorkerVerification(workerId, url, name)
      if (ok) toastSuccess('Submitted', 'Your ID is queued for review. This usually takes < 24h.')
      else toastError('Failed', 'Could not submit your ID for review')
      return ok
    }

    const url = await uploadPhoto(file, `verification/${workerId}`)

    const store = getDemoStore()
    const item = store.verificationQueue.find((v) => v.workerId === workerId)
    if (item) {
      item.govIdUrl = url
      item.status = 'pending'
      item.submittedAt = new Date().toISOString()
    } else {
      store.verificationQueue.push({
        workerId,
        workerName: name,
        govIdUrl: url,
        submittedAt: new Date().toISOString(),
        status: 'pending',
      })
    }
    const worker = store.workers.find((w) => w.userId === workerId)
    if (worker) {
      worker.govIdUrl = url
      worker.verificationStatus = 'pending'
    }
    persistDemoStore(store)
    toastSuccess('Submitted', 'Your ID is queued for review. This usually takes < 24h.')
    return true
  } catch (e) {
    toastError('Upload failed', e instanceof Error ? e.message : 'Please try again')
    return false
  }
}