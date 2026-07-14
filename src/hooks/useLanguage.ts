import { useEffect, useState } from 'react'
import { isLanguage, type Language } from '../i18n'

/**
 * Preferenza di LINGUA del dispositivo: come il tema, vive fuori da AppData di proposito
 * (non ha senso in un backup e non deve far scattare una versione di schema).
 */
export const LANGUAGE_STORAGE_KEY = 'open-gym-app/lingua'

/**
 * La lingua NON si deduce dal browser. In Electron (Cypress) e sui runner della CI la lingua di
 * sistema è l'inglese: un rilevamento automatico tradurrebbe l'interfaccia sotto ai test, che
 * asseriscono il testo italiano. È la stessa lezione di `prefers-color-scheme` (vedi CLAUDE.md):
 * mai far dipendere il comportamento dall'ambiente. Si sceglie da Impostazioni, e basta.
 */
export const DEFAULT_LANGUAGE: Language = 'it'

function readPreference(): Language {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  return isLanguage(stored) ? stored : DEFAULT_LANGUAGE
}

/** Applica la lingua al documento (`lang` su <html>, che serve a screen reader e traduttori). */
export function useLanguage(): [Language, (language: Language) => void] {
  const [language, setLanguage] = useState<Language>(readPreference)

  useEffect(() => {
    document.documentElement.lang = language
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  }, [language])

  return [language, setLanguage]
}
