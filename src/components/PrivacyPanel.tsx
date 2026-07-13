import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import { useT } from '../i18n/context'

interface Props {
  enabled: boolean
  /** Il browser chiede Do Not Track: le statistiche restano spente e l'interruttore è bloccato. */
  doNotTrack: boolean
  onChange: (enabled: boolean) => void
}

/** Statistiche d'uso anonime: sempre spiegate, sempre disattivabili. */
export function PrivacyPanel({ enabled, doNotTrack, onChange }: Props) {
  const t = useT()

  return (
    <Card component="section" data-cy="privacy-panel">
      <CardContent>
        <Typography variant="h2" gutterBottom>
          {t('privacy.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('privacy.explanation')}
        </Typography>
        <FormControlLabel
          label={enabled ? t('privacy.toggleOn') : t('privacy.toggleOff')}
          control={
            <Switch
              checked={enabled}
              disabled={doNotTrack}
              onChange={(e) => onChange(e.target.checked)}
              // Lo slot input di Switch non tipizza i data-*: cast al tipo HTML nativo
              slotProps={{
                input: {
                  'data-cy': 'analytics-toggle',
                } as React.InputHTMLAttributes<HTMLInputElement>,
              }}
            />
          }
        />
        {doNotTrack && (
          <Typography variant="body2" color="text.secondary" data-cy="analytics-dnt">
            {t('privacy.doNotTrack')}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}
