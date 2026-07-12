import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
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
    <Alert
      severity="info"
      role="status"
      data-cy="update-banner"
      action={
        <>
          <Button
            color="inherit"
            size="small"
            data-cy="update-reload"
            onClick={() => updateServiceWorker(true)}
          >
            Aggiorna ora
          </Button>
          <Button
            color="inherit"
            size="small"
            data-cy="update-dismiss"
            onClick={() => setNeedRefresh(false)}
          >
            Più tardi
          </Button>
        </>
      }
    >
      È disponibile una nuova versione dell'app.
    </Alert>
  )
}
