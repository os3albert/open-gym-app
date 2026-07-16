import { useEffect, useState } from 'react'

/**
 * Il giorno di scheda selezionato per l'allenamento, nella query string (?giorno=…).
 *
 * Nasce con la Home (M16): il click su un giorno della scheda attiva porta alla vista
 * Allenamento CON quel giorno già scelto — e un giorno scelto vince anche sul giorno della
 * settimana, perché chi clicca «Giorno B» di martedì vuole il Giorno B, non il martedì.
 *
 * Stessa regola sacra di useView/useFilters: si parte SEMPRE dai parametri correnti e si
 * tocca solo la propria chiave, o si cancellano i parametri altrui.
 */
export function useWorkoutDay(): [string | null, (day: string | null) => void] {
  const [day, setDay] = useState<string | null>(() =>
    new URLSearchParams(window.location.search).get('giorno'),
  )

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (day) params.set('giorno', day)
    else params.delete('giorno')
    const query = params.toString()
    window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname)
  }, [day])

  return [day, setDay]
}
