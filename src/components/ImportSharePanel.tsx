import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { translateError } from '../i18n'
import { useT } from '../i18n/context'
import { decodeShare, type SharePayload } from '../services/share'

interface Props {
  /** Codice arrivato da un link #dati=…: precompila e mostra subito l'anteprima. */
  initialCode?: string | null
  /** Applica il pacchetto ai dati; se era una scheda ritorna l'id importato. */
  onImport: (payload: SharePayload) => string | undefined
  onActivatePlan: (planId: string) => void
}

/** Importazione di un codice condiviso: anteprima, conferma, «Prova questa scheda». */
export function ImportSharePanel({ initialCode, onImport, onActivatePlan }: Props) {
  const t = useT()
  const [code, setCode] = useState(initialCode ?? '')
  const [preview, setPreview] = useState<SharePayload | null>(() => {
    if (!initialCode) return null
    try {
      return decodeShare(initialCode)
    } catch {
      return null
    }
  })
  const [error, setError] = useState<string | null>(null)
  const [importedPlanId, setImportedPlanId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  function handlePreview() {
    try {
      setPreview(decodeShare(code))
      setError(null)
      setMessage(null)
      setImportedPlanId(null)
    } catch (err) {
      setPreview(null)
      setError(translateError(t, err))
    }
  }

  function handleConfirm() {
    if (!preview) return
    const planId = onImport(preview)
    setImportedPlanId(planId ?? null)
    setMessage(
      preview.kind === 'plan'
        ? 'Scheda aggiunta alle tue!'
        : 'Esercizio aggiunto ai tuoi (se non lo avevi già).',
    )
    setPreview(null)
    setCode('')
  }

  function handleCancel() {
    setPreview(null)
    setError(null)
    setMessage(null)
    setCode('')
  }

  return (
    <Card component="section" data-cy="import-panel">
      <CardContent>
        <Typography variant="h2" gutterBottom>
          Importa da un altro utente
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Incolla il codice di condivisione ricevuto: vedrai un'anteprima prima di aggiungere.
        </Typography>
        <Stack spacing={1.5}>
          <TextField
            label="Codice ricevuto"
            multiline
            rows={3}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            slotProps={{
              htmlInput: {
                'data-cy': 'import-code-input',
                sx: { fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all' },
              },
            }}
          />
          <Stack direction="row">
            <Button
              variant="contained"
              data-cy="import-preview-btn"
              disabled={!code.trim()}
              onClick={handlePreview}
            >
              Anteprima
            </Button>
          </Stack>

          {error && (
            <Alert severity="error" role="alert" data-cy="import-error">
              {error}
            </Alert>
          )}

          {preview && (
            <Box
              data-cy="import-preview"
              sx={{ border: 1, borderColor: 'divider', borderRadius: 3, p: 2 }}
            >
              {preview.kind === 'exercise' ? (
                <>
                  <Typography variant="h3" component="h3" gutterBottom>
                    Esercizio: {preview.exercise.name}
                  </Typography>
                  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                    {preview.exercise.muscleGroup && (
                      <Chip size="small" label={preview.exercise.muscleGroup} />
                    )}
                    {preview.exercise.stature && (
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`${preview.exercise.stature.minCm}–${preview.exercise.stature.maxCm} cm`}
                      />
                    )}
                  </Stack>
                </>
              ) : (
                <>
                  <Typography variant="h3" component="h3" gutterBottom>
                    Scheda: {preview.plan.name}
                  </Typography>
                  {preview.plan.days.map((day) => (
                    <Box key={day.name} data-cy="import-preview-day" sx={{ mt: 1 }}>
                      <Typography component="strong" sx={{ fontWeight: 600 }}>
                        {day.name}
                      </Typography>
                      <Box component="ul" sx={{ m: 0, pl: 3 }}>
                        {day.entries.map((entry, i) => (
                          <Typography component="li" variant="body2" key={i}>
                            {entry.exercise.name} — {entry.sets}×{entry.reps}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  ))}
                </>
              )}
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mt: 2 }}>
                <Button variant="contained" data-cy="import-confirm" onClick={handleConfirm}>
                  Aggiungi ai miei
                </Button>
                <Button color="inherit" data-cy="import-cancel" onClick={handleCancel}>
                  Annulla
                </Button>
              </Stack>
            </Box>
          )}

          {message && (
            <Typography variant="body2" sx={{ color: 'success.main' }} data-cy="import-success">
              {message}
            </Typography>
          )}
          {importedPlanId && (
            <Stack direction="row">
              <Button
                variant="outlined"
                data-cy="try-imported-plan"
                onClick={() => {
                  onActivatePlan(importedPlanId)
                  setImportedPlanId(null)
                  setMessage('Fatta! Ora è la tua scheda attiva.')
                }}
              >
                Prova questa scheda
              </Button>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}
