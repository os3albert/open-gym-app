/**
 * Statistiche d'uso con Umami: **cookieless**, senza dati personali, senza identificatori
 * persistenti e senza IP memorizzati — per questo non serve un banner di consenso (GDPR).
 * Restano comunque due garanzie in più:
 *  - lo script si carica SOLO se l'istanza è configurata (VITE_UMAMI_*): senza, zero rete;
 *  - l'utente può disattivarlo (opt-out persistito) e il Do Not Track del browser è rispettato.
 * Non si tracciano MAI contenuti dell'utente: solo la vista aperta.
 */

/** Chiave separata da AppData: la scelta non entra nel backup né nello schema dati. */
const OPT_OUT_KEY = 'open-gym-app/statistiche'
const SCRIPT_ID = 'umami-analytics'

export interface AnalyticsConfig {
  src: string
  websiteId: string
}

/** Configurazione dell'istanza; assente = statistiche non disponibili del tutto. */
export function analyticsConfig(): AnalyticsConfig | null {
  const src = import.meta.env.VITE_UMAMI_SRC
  const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID
  return typeof src === 'string' && src !== '' && typeof websiteId === 'string' && websiteId !== ''
    ? { src, websiteId }
    : null
}

/** Do Not Track del browser: se l'utente l'ha chiesto, non si misura nulla. */
export function doNotTrackEnabled(): boolean {
  return navigator.doNotTrack === '1' || window.doNotTrack === '1'
}

export function isOptedOut(): boolean {
  try {
    return localStorage.getItem(OPT_OUT_KEY) === 'no'
  } catch {
    return false
  }
}

export function setOptedOut(optedOut: boolean): void {
  try {
    localStorage.setItem(OPT_OUT_KEY, optedOut ? 'no' : 'si')
  } catch {
    // Storage non disponibile: la scelta vale per questa sessione
  }
}

/** Le statistiche partono solo se: configurate, non disattivate e senza Do Not Track. */
export function analyticsAllowed(): boolean {
  return analyticsConfig() !== null && !isOptedOut() && !doNotTrackEnabled()
}

/** Aggiunge lo script Umami (idempotente). */
export function loadAnalytics(config: AnalyticsConfig): void {
  if (document.getElementById(SCRIPT_ID)) return
  const script = document.createElement('script')
  script.id = SCRIPT_ID
  script.async = true
  script.defer = true
  script.src = config.src
  script.dataset.websiteId = config.websiteId
  // Niente cookie, niente localStorage lato Umami, niente raccolta automatica di URL con dati
  script.dataset.autoTrack = 'false'
  document.head.appendChild(script)
}

/** Rimuove lo script: dopo l'opt-out non deve restare nulla in pagina. */
export function unloadAnalytics(): void {
  document.getElementById(SCRIPT_ID)?.remove()
  delete window.umami
}

/** Registra la vista aperta (solo il nome della sezione: mai contenuti dell'utente). */
export function trackView(view: string): void {
  window.umami?.track?.((props) => ({ ...props, name: 'vista', data: { vista: view } }))
}

declare global {
  interface Window {
    doNotTrack?: string
    umami?: {
      track?: (payload: (props: Record<string, unknown>) => Record<string, unknown>) => void
    }
  }
}
