import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * Avviso «nuova versione disponibile» (issue #25): il service worker è in modalità
 * prompt, quindi l'aggiornamento si applica solo quando l'utente lo chiede.
 */
export function UpdateBanner() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="banner-update" role="status" data-cy="update-banner">
      È disponibile una nuova versione dell'app.
      <span className="banner-update-actions">
        <button type="button" data-cy="update-reload" onClick={() => updateServiceWorker(true)}>
          Aggiorna ora
        </button>
        <button
          type="button"
          className="btn-ghost btn-small"
          data-cy="update-dismiss"
          onClick={() => setNeedRefresh(false)}
        >
          Più tardi
        </button>
      </span>
    </div>
  )
}
