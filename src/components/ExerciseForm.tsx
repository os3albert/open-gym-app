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
import { useT } from '../i18n/context'
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
  const t = useT()
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
          {initial ? t('form.editTitle') : t('form.newTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('form.intro')}
        </Typography>
        <Stack component="form" spacing={2} onSubmit={handleSubmit}>
          <TextField
            label={t('form.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            slotProps={{ htmlInput: { 'data-cy': 'exercise-name' } }}
          />
          <TextField
            label={t('form.muscleGroup')}
            value={muscleGroup}
            onChange={(e) => setMuscleGroup(e.target.value)}
            slotProps={{ htmlInput: { 'data-cy': 'exercise-muscle' } }}
          />
          <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <TextField
              label={t('form.statureFrom')}
              type="number"
              placeholder={t('form.statureFromExample')}
              value={statureMin}
              onChange={(e) => setStatureMin(e.target.value)}
              slotProps={{ htmlInput: { 'data-cy': 'exercise-stature-min' } }}
            />
            <TextField
              label={t('form.statureTo')}
              type="number"
              placeholder={t('form.statureToExample')}
              value={statureMax}
              onChange={(e) => setStatureMax(e.target.value)}
              slotProps={{ htmlInput: { 'data-cy': 'exercise-stature-max' } }}
            />
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {t('form.statureHint')}
          </Typography>
          <TextField
            label={t('form.youtube')}
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
              alt={t('form.videoPreviewAlt')}
            />
          )}
          <TextField
            label={t('form.description')}
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            slotProps={{ htmlInput: { 'data-cy': 'exercise-description' } }}
          />
          <details className="guidelines" data-cy="video-guidelines">
            <summary>{t('form.guidelinesSummary')}</summary>
            <ul>
              <li>{t('form.guidelineStudio')}</li>
              <li>{t('form.guidelineApps')}</li>
              <li>{t('form.guidelineFullRep')}</li>
              <li>{t('form.guidelineUnlisted')}</li>
            </ul>
          </details>
          <FormControlLabel
            label={t('form.faceBlurCheckbox')}
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
              {initial ? t('form.submitEdit') : t('form.submitNew')}
            </Button>
            {initial && onCancel && (
              <Button variant="text" color="inherit" data-cy="edit-cancel" onClick={onCancel}>
                {t('form.cancelEdit')}
              </Button>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}
