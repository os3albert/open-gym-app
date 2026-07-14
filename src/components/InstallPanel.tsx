import InstallMobileIcon from '@mui/icons-material/InstallMobile'
import IosShareIcon from '@mui/icons-material/IosShare'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { useT } from '../i18n/context'

/**
 * Invito a installare l'app. Compare solo quando serve davvero: sparisce se l'app è
 * già installata, e su iOS diventa un'istruzione perché Safari non espone alcun evento
 * di installazione (vedi hooks/useInstallPrompt.ts).
 */
export function InstallPanel() {
  const t = useT()
  const { canInstall, showIosHint, install } = useInstallPrompt()

  if (canInstall) {
    return (
      <Stack direction="row" sx={{ mt: 2 }}>
        <Button
          variant="contained"
          startIcon={<InstallMobileIcon />}
          data-cy="install-button"
          onClick={() => void install()}
        >
          {t('install.button')}
        </Button>
      </Stack>
    )
  }

  if (showIosHint) {
    return (
      <Stack
        direction="row"
        spacing={0.75}
        sx={{ mt: 2, alignItems: 'center' }}
        data-cy="install-ios-hint"
      >
        <IosShareIcon fontSize="small" color="primary" />
        <Typography variant="body2" color="text.secondary">
          {t('install.iosHintPrefix')} <strong>{t('install.iosShare')}</strong> →{' '}
          <strong>{t('install.iosAddToHome')}</strong>.
        </Typography>
      </Stack>
    )
  }

  return null
}
