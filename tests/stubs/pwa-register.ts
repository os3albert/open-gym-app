// Stub di virtual:pwa-register/react per l'ambiente di test (vedi alias in vite.config.ts):
// nessun service worker sotto jsdom, il banner di aggiornamento resta spento.
import { useState } from 'react'

export function useRegisterSW() {
  const needRefresh = useState(false)
  const offlineReady = useState(false)
  return {
    needRefresh,
    offlineReady,
    updateServiceWorker: async (_reloadPage?: boolean) => {},
  }
}
