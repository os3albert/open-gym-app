import { useEffect, useState } from 'react'

export type AppView = 'esercizi' | 'allenamento' | 'storico'

const VIEWS: AppView[] = ['esercizi', 'allenamento', 'storico']

function readViewFromUrl(): AppView {
  const value = new URLSearchParams(window.location.search).get('vista')
  return VIEWS.includes(value as AppView) ? (value as AppView) : 'esercizi'
}

/** La vista corrente vive nella query string (?vista=…), senza toccare gli altri parametri. */
export function useView(): [AppView, (view: AppView) => void] {
  const [view, setView] = useState<AppView>(readViewFromUrl)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (view === 'esercizi') params.delete('vista')
    else params.set('vista', view)
    const query = params.toString()
    window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname)
  }, [view])

  return [view, setView]
}
