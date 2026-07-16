import { useEffect, useState } from 'react'

export type AppView = 'community' | 'schede' | 'allenamento' | 'storico' | 'impostazioni'

const VIEWS: AppView[] = ['community', 'schede', 'allenamento', 'storico', 'impostazioni']

function readViewFromUrl(): AppView | null {
  const value = new URLSearchParams(window.location.search).get('vista')
  return VIEWS.includes(value as AppView) ? (value as AppView) : null
}

/** La vista corrente vive nella query string (?vista=…), senza toccare gli altri parametri. */
export function useView(fallback: AppView = 'community'): [AppView, (view: AppView) => void] {
  const [view, setView] = useState<AppView>(() => readViewFromUrl() ?? fallback)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (view === 'community') params.delete('vista')
    else params.set('vista', view)
    const query = params.toString()
    window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname)
  }, [view])

  return [view, setView]
}
