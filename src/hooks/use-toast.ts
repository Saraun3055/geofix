import { create } from 'zustand'

export type Toast = {
  id: string
  title?: string
  message: string
  type?: 'info' | 'success' | 'error' | 'warning'
  duration?: number
}

type ToastStore = {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `t${Date.now()}`
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, toast.duration ?? 4000)
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export function toast(title: string, message: string, type: Toast['type'] = 'info') {
  useToastStore.getState().addToast({ title, message, type })
}

export function toastSuccess(title: string, message: string) {
  useToastStore.getState().addToast({ title, message, type: 'success' })
}

export function toastError(title: string, message: string) {
  useToastStore.getState().addToast({ title, message, type: 'error' })
}