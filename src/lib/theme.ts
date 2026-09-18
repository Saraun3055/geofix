import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'geofix-theme'

function readStored(): Theme {
  if (typeof window === 'undefined') return 'light'
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

function applyToDom(theme: Theme): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
}

let theme: Theme = readStored()
const listeners = new Set<() => void>()
applyToDom(theme)

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

/** Toggle the `.dark` class, persist the choice and refresh subscribers. */
export function setTheme(next: Theme): void {
  if (next === theme) return
  theme = next
  try {
    window.localStorage.setItem(STORAGE_KEY, next)
  } catch {
    /* ignore private-mode failures */
  }
  applyToDom(next)
  listeners.forEach((l) => l())
}

export function toggleTheme(): void {
  setTheme(theme === 'dark' ? 'light' : 'dark')
}

/** Reactive read of the current theme; the site always starts in light mode. */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, () => theme)
}

/** Ensure the persisted theme is visible before first paint (no FOUC). */
export function initTheme(): void {
  applyToDom(theme)
}