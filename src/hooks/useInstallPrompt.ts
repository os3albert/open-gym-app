import { useCallback, useEffect, useState } from 'react'

/** L'evento non è ancora standard: nei tipi del DOM non esiste. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** L'app è già aperta come applicazione installata (non nella scheda del browser). */
function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone
  if (iosStandalone === true) return true
  // jsdom non implementa matchMedia (stesso guardrail di hooks/useTheme.ts)
  if (typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(display-mode: standalone)').matches
}

/** Safari su iPhone/iPad: non esiste alcun evento di installazione, solo il menu Condividi. */
function isIos(): boolean {
  if (typeof window === 'undefined') return false
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

/**
 * Installazione della PWA. Chrome (desktop e Android) annuncia l'installabilità con
 * `beforeinstallprompt`: l'evento va intercettato e conservato, perché è **monouso** e
 * si può riproporre solo ricaricando. Su iOS quell'evento non esiste: lì l'unica strada
 * è spiegare il gesto («Condividi → Aggiungi a schermata Home»).
 */
export function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(isStandalone)

  useEffect(() => {
    function onBeforeInstallPrompt(event: Event) {
      // Senza preventDefault Chrome mostra la sua mini-infobar: l'invito lo diamo noi
      event.preventDefault()
      setPromptEvent(event as BeforeInstallPromptEvent)
    }
    function onInstalled() {
      setInstalled(true)
      setPromptEvent(null)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = useCallback(async () => {
    if (!promptEvent) return
    await promptEvent.prompt()
    await promptEvent.userChoice
    // L'evento è consumato: che l'utente abbia accettato o no, non si può riusare
    setPromptEvent(null)
  }, [promptEvent])

  return {
    /** Chrome: si può aprire la finestra di installazione del browser. */
    canInstall: promptEvent !== null && !installed,
    /** iOS: niente evento, si può solo spiegare il gesto. */
    showIosHint: isIos() && !installed,
    installed,
    install,
  }
}
