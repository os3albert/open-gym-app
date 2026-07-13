import { useMemo, type ReactNode } from 'react'
import { TranslateContext } from './context'
import { makeTranslate, type Language } from './index'

/** Rende `t` disponibile a tutto l'albero (il provider sta in App, sopra ThemeProvider). */
export function I18nProvider({ language, children }: { language: Language; children: ReactNode }) {
  const t = useMemo(() => makeTranslate(language), [language])
  return <TranslateContext.Provider value={t}>{children}</TranslateContext.Provider>
}
