import { useEffect, useState } from 'react'

export type AppView = 'home' | 'community' | 'schede' | 'allenamento' | 'storico' | 'impostazioni'

const VIEWS: AppView[] = ['home', 'community', 'schede', 'allenamento', 'storico', 'impostazioni']

function readViewFromUrl(): AppView | null {
  const value = new URLSearchParams(window.location.search).get('vista')
  return VIEWS.includes(value as AppView) ? (value as AppView) : null
}

/** La vista corrente vive nella query string (?vista=…), senza toccare gli altri parametri. */
export function useView(fallback: AppView = 'home'): [AppView, (view: AppView) => void] {
  const [view, setView] = useState<AppView>(() => readViewFromUrl() ?? fallback)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    // La Home è l'atterraggio (M16): senza parametro si è lì
    if (view === 'home') params.delete('vista')
    else params.set('vista', view)
    const query = params.toString()
    window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname)
  }, [view])

  return [view, setView]
}
