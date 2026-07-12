import { useEffect, useReducer, useState } from 'react'

/** Preferenza dell'utente; «auto» segue il tema di sistema (prefers-color-scheme). */
export type ThemePreference = 'auto' | 'chiaro' | 'scuro'

/**
 * Preferenza di TEMA del dispositivo: vive fuori da AppData di proposito
 * (non ha senso in un backup e non deve far scattare una versione di schema).
 */
export const THEME_STORAGE_KEY = 'open-gym-app/tema'

const PREFERENCES: ThemePreference[] = ['auto', 'chiaro', 'scuro']

function readPreference(): ThemePreference {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  return PREFERENCES.includes(stored as ThemePreference) ? (stored as ThemePreference) : 'auto'
}

function systemPrefersLight(): boolean {
  // jsdom non implementa matchMedia: senza informazione si resta sul tema scuro di default
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: light)').matches
  )
}

function resolve(preference: ThemePreference): 'light' | 'dark' {
  if (preference === 'chiaro') return 'light'
  if (preference === 'scuro') return 'dark'
  return systemPrefersLight() ? 'light' : 'dark'
}

/**
 * Applica il tema al documento (data-theme su <html>) e persiste la preferenza.
 * Espone anche il tema risolto (light/dark): serve a tenere il ThemeProvider MUI
 * allineato allo STESSO valore, così i due scrittori dell'attributo non litigano mai.
 */
export function useTheme(): [
  ThemePreference,
  (preference: ThemePreference) => void,
  'light' | 'dark',
] {
  const [preference, setPreference] = useState<ThemePreference>(readPreference)
  // In «auto» un cambio di tema di sistema deve solo far ricalcolare resolve()
  const [, onSystemChange] = useReducer((tick: number) => tick + 1, 0)
  const resolved = resolve(preference)

  useEffect(() => {
    document.documentElement.dataset.theme = resolved
    localStorage.setItem(THEME_STORAGE_KEY, preference)
    if (preference !== 'auto' || typeof window.matchMedia !== 'function') return
    // In «auto» il tema segue i cambi di sistema in tempo reale
    const media = window.matchMedia('(prefers-color-scheme: light)')
    media.addEventListener('change', onSystemChange)
    return () => media.removeEventListener('change', onSystemChange)
  }, [preference, resolved])

  return [preference, setPreference, resolved]
}
