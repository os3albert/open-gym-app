import { useState, type FormEvent } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import type { NewExercise } from '../domain/exercises'
import type { Exercise } from '../domain/types'
import { parseYouTubeVideoId, youtubeThumbnailUrl } from '../services/youtube'

interface Props {
  /** Esercizio in modifica; null = nuova proposta. Rimontare il form (key) quando cambia. */
  initial?: Exercise | null
  /** Ritorna true se l'esercizio è stato accettato (il form si svuota). */
  onSubmit: (input: NewExercise) => boolean
  onCancel?: () => void
  error: string | null
}

export function ExerciseForm({ initial = null, onSubmit, onCancel, error }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [muscleGroup, setMuscleGroup] = useState(initial?.muscleGroup ?? '')
  const [youtubeUrl, setYoutubeUrl] = useState(initial?.youtubeUrl ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [statureMin, setStatureMin] = useState(
    initial?.stature ? String(initial.stature.minCm) : '',
  )
  const [statureMax, setStatureMax] = useState(
    initial?.stature ? String(initial.stature.maxCm) : '',
  )
  const [faceBlurConfirmed, setFaceBlurConfirmed] = useState(initial?.faceBlurConfirmed ?? false)

  const previewVideoId = parseYouTubeVideoId(youtubeUrl)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const hasStature = statureMin.trim() !== '' || statureMax.trim() !== ''
    const accepted = onSubmit({
      name,
      muscleGroup,
      youtubeUrl,
      description,
      faceBlurConfirmed,
      ...(hasStature ? { stature: { minCm: Number(statureMin), maxCm: Number(statureMax) } } : {}),
    })
    if (accepted && !initial) {
      setName('')
      setMuscleGroup('')
      setYoutubeUrl('')
      setDescription('')
      setStatureMin('')
      setStatureMax('')
      setFaceBlurConfirmed(false)
    }
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h2" gutterBottom>
          {initial ? 'Modifica esercizio' : 'Proponi un esercizio'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Carica il link di un video YouTube con il volto offuscato dall'AI: si valuta l'esercizio,
          non la persona.
        </Typography>
        <Stack component="form" spacing={2} onSubmit={handleSubmit}>
          <TextField
            label="Nome esercizio"
            value={name}
            onChange={(e) => setName(e.target.value)}
            slotProps={{ htmlInput: { 'data-cy': 'exercise-name' } }}
          />
          <TextField
            label="Gruppo muscolare"
            value={muscleGroup}
            onChange={(e) => setMuscleGroup(e.target.value)}
            slotProps={{ htmlInput: { 'data-cy': 'exercise-muscle' } }}
          />
          <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <TextField
              label="Statura consigliata da (cm)"
              type="number"
              placeholder="es. 170"
              value={statureMin}
              onChange={(e) => setStatureMin(e.target.value)}
              slotProps={{ htmlInput: { 'data-cy': 'exercise-stature-min' } }}
            />
            <TextField
              label="a (cm)"
              type="number"
              placeholder="es. 190"
              value={statureMax}
              onChange={(e) => setStatureMax(e.target.value)}
              slotProps={{ htmlInput: { 'data-cy': 'exercise-stature-max' } }}
            />
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Lascia vuota la fascia di statura se l'esercizio è adatto a tutti.
          </Typography>
          <TextField
            label="Link YouTube (volto offuscato)"
            placeholder="https://www.youtube.com/watch?v=..."
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            slotProps={{ htmlInput: { 'data-cy': 'exercise-youtube' } }}
          />
          {previewVideoId && (
            <img
              className="video-preview"
              data-cy="video-preview"
              src={youtubeThumbnailUrl(previewVideoId)}
              alt="Anteprima del video YouTube"
            />
          )}
          <TextField
            label="Descrizione"
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            slotProps={{ htmlInput: { 'data-cy': 'exercise-description' } }}
          />
          <details className="guidelines" data-cy="video-guidelines">
            <summary>Linee guida video (volto offuscato)</summary>
            <ul>
              <li>
                Su YouTube Studio: Editor → Sfoca → «Sfocatura viso», rileva e segue i volti
                automaticamente (gratuito).
              </li>
              <li>
                In alternativa: app di editing con blur AI (es. CapCut) prima del caricamento.
              </li>
              <li>Il video deve mostrare l'esecuzione completa dell'esercizio.</li>
              <li>Carica come «Non in elenco» se non vuoi che appaia nel tuo canale.</li>
            </ul>
          </details>
          <FormControlLabel
            label="Confermo che il volto nel video è offuscato"
            control={
              <Checkbox
                checked={faceBlurConfirmed}
                onChange={(e) => setFaceBlurConfirmed(e.target.checked)}
                // Lo slot input di Checkbox non tipizza i data-*: cast al tipo HTML nativo
                slotProps={{
                  input: {
                    'data-cy': 'face-blur-checkbox',
                  } as React.InputHTMLAttributes<HTMLInputElement>,
                }}
              />
            }
          />
          {error && (
            <Alert severity="error" role="alert" data-cy="form-error">
              {error}
            </Alert>
          )}
          <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Button
              type="submit"
              variant="contained"
              data-cy="exercise-submit"
              disabled={!faceBlurConfirmed}
            >
              {initial ? 'Salva modifiche' : 'Proponi esercizio'}
            </Button>
            {initial && onCancel && (
              <Button variant="text" color="inherit" data-cy="edit-cancel" onClick={onCancel}>
                Annulla modifica
              </Button>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}
