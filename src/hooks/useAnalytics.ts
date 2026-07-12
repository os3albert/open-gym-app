import { useCallback, useEffect, useState } from 'react'
import {
  analyticsAllowed,
  analyticsConfig,
  doNotTrackEnabled,
  isOptedOut,
  loadAnalytics,
  setOptedOut,
  trackView,
  unloadAnalytics,
} from '../services/analytics'

/**
 * Statistiche d'uso anonime (vedi services/analytics.ts): si caricano solo se l'istanza
 * è configurata, l'utente non le ha disattivate e il browser non chiede Do Not Track.
 * Il cambio di vista è l'unico evento inviato.
 */
export function useAnalytics(view: string) {
  const available = analyticsConfig() !== null
  const dnt = doNotTrackEnabled()
  const [enabled, setEnabled] = useState(() => analyticsAllowed())

  useEffect(() => {
    const config = analyticsConfig()
    if (!enabled || config === null) {
      unloadAnalytics()
      return
    }
    loadAnalytics(config)
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    trackView(view)
  }, [enabled, view])

  const setAnalyticsEnabled = useCallback((next: boolean) => {
    setOptedOut(!next)
    setEnabled(next && analyticsAllowed())
  }, [])

  return {
    /** L'istanza ha configurato le statistiche: senza, l'interruttore non ha senso. */
    available,
    /** Il browser chiede Do Not Track: le statistiche restano spente e non si possono accendere. */
    doNotTrack: dnt,
    enabled,
    optedOut: isOptedOut(),
    setAnalyticsEnabled,
  }
}
