import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'

interface Props {
  enabled: boolean
  /** Il browser chiede Do Not Track: le statistiche restano spente e l'interruttore è bloccato. */
  doNotTrack: boolean
  onChange: (enabled: boolean) => void
}

/** Statistiche d'uso anonime: sempre spiegate, sempre disattivabili. */
export function PrivacyPanel({ enabled, doNotTrack, onChange }: Props) {
  return (
    <Card component="section" data-cy="privacy-panel">
      <CardContent>
        <Typography variant="h2" gutterBottom>
          Statistiche d'uso
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Contiamo in forma anonima quali sezioni dell'app vengono usate, per capire cosa
          migliorare. Nessun cookie, nessun profilo, nessun identificatore: non registriamo il tuo
          indirizzo IP e i tuoi esercizi, allenamenti e schede non lasciano mai il dispositivo.
        </Typography>
        <FormControlLabel
          label={enabled ? 'Statistiche anonime attive' : 'Statistiche anonime disattivate'}
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
            Il tuo browser chiede di non essere tracciato («Do Not Track»): rispettiamo la scelta e
            le statistiche restano spente.
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}
