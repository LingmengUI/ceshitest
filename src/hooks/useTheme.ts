import { useEffect, useMemo, useState } from 'react'
import type { ThemePreference } from '../types'

function systemPrefersDark() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

export function useTheme(preference: ThemePreference) {
  const [systemDark, setSystemDark] = useState(() => (typeof window === 'undefined' ? false : systemPrefersDark()))

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => setSystemDark(media.matches)
    handleChange()
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  const resolvedTheme = useMemo(() => {
    if (preference === 'system') return systemDark ? 'dark' : 'light'
    return preference
  }, [preference, systemDark])

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme
    document.documentElement.style.colorScheme = resolvedTheme
  }, [resolvedTheme])

  return resolvedTheme
}
