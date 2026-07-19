export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export function getStorage(): StorageLike | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null
    const probe = '__ai_ops_storage_probe__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return window.localStorage
  } catch {
    return null
  }
}

export function readJson<T>(
  key: string,
  fallback: T,
  storage: StorageLike | null = getStorage(),
  validate?: (value: unknown) => value is T,
): T {
  if (!storage) return fallback

  try {
    const value = storage.getItem(key)
    if (!value) return fallback
    const parsed: unknown = JSON.parse(value)
    if (validate) return validate(parsed) ? parsed : fallback
    return parsed as T
  } catch {
    return fallback
  }
}

export function writeJson<T>(key: string, value: T, storage: StorageLike | null = getStorage()): boolean {
  if (!storage) return false

  try {
    storage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}
