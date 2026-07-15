import { useState, type FormEvent } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import type { NewExercise } from '../domain/exercises'
import { useT } from '../i18n/context'
import { DIFFICULTIES, type Difficulty, type Exercise, type MuscleGroup } from '../domain/types'
import { MuscleGroupField } from './MuscleGroupField'
import { SelectField } from './SelectField'
import { parseYouTubeVideoId, youtubeThumbnailUrl } from '../services/youtube'
import { range } from '../utils/number'
import { NumberField } from './NumberField'

interface Props {
  /** Esercizio in modifica; null = nuova proposta. Rimontare il form (key) quando cambia. */
  initial?: Exercise | null
  /** Ritorna true se l'esercizio è stato accettato (il form si svuota). */
  onSubmit: (input: NewExercise) => boolean
  onCancel?: () => void
  error: string | null
}

/** Le stature plausibili: le stesse che il dominio accetta (100–250 cm). */
const STATURES = range(100, 250)

export function ExerciseForm({ initial = null, onSubmit, onCancel, error }: Props) {
  const t = useT()
  const [name, setName] = useState(initial?.name ?? '')
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | ''>(initial?.muscleGroup ?? '')
  const [youtubeUrl, setYoutubeUrl] = useState(initial?.youtubeUrl ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  // Nessuna preselezione: la difficoltà è una scelta, e senza il dominio rifiuta la proposta
  const [difficulty, setDifficulty] = useState<Difficulty | ''>(initial?.difficulty ?? '')
  const [statureMin, setStatureMin] = useState(
    initial?.stature ? String(initial.stature.minCm) : '',
  )
  const [statureMax, setStatureMax] = useState(
    initial?.stature ? String(initial.stature.maxCm) : '',
  )

  const previewVideoId = parseYouTubeVideoId(youtubeUrl)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const hasStature = statureMin.trim() !== '' || statureMax.trim() !== ''
    const accepted = onSubmit({
      name,
      muscleGroup: muscleGroup as MuscleGroup,
      youtubeUrl,
      description,
      difficulty: difficulty as Difficulty,
      ...(hasStature ? { stature: { minCm: Number(statureMin), maxCm: Number(statureMax) } } : {}),
    })
    if (accepted && !initial) {
      setName('')
      setMuscleGroup('')
      setYoutubeUrl('')
      setDescription('')
      setStatureMin('')
      setStatureMax('')
      setDifficulty('')
    }
  }

  return (
    <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
      <Typography variant="h2" gutterBottom id="titolo-proposta">
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
        <MuscleGroupField value={muscleGroup} onChange={setMuscleGroup} dataCy="exercise-muscle" />
        <SelectField
          label={t('form.difficulty')}
          value={difficulty}
          onChange={(value) => setDifficulty(value as Difficulty)}
          dataCy="exercise-difficulty"
          sx={{ maxWidth: 240 }}
          options={[
            { value: '', label: t('form.difficultyChoose') },
            ...DIFFICULTIES.map((d) => ({ value: d, label: t(`difficulty.${d}`) })),
          ]}
        />
        <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <NumberField
            label={t('form.statureFrom')}
            placeholder={t('form.statureFromExample')}
            value={statureMin}
            onChange={setStatureMin}
            dataCy="exercise-stature-min"
            options={STATURES}
          />
          <NumberField
            label={t('form.statureTo')}
            placeholder={t('form.statureToExample')}
            value={statureMax}
            onChange={setStatureMax}
            dataCy="exercise-stature-max"
            options={STATURES}
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
        {/* Il volto offuscato è un consiglio, non un obbligo (M12): niente più spunta che blocca
              la proposta. Resta la dicitura, perché la ragione per cui lo consigliamo non cambia. */}
        <Typography variant="caption" color="text.secondary" data-cy="face-blur-note">
          {t('form.faceBlurNote')}
        </Typography>
        {error && (
          <Alert severity="error" role="alert" data-cy="form-error">
            {error}
          </Alert>
        )}
        <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <Button type="submit" variant="contained" data-cy="exercise-submit">
            {initial ? t('form.submitEdit') : t('form.submitNew')}
          </Button>
          {initial && onCancel && (
            <Button variant="text" color="inherit" data-cy="edit-cancel" onClick={onCancel}>
              {t('form.cancelEdit')}
            </Button>
          )}
        </Stack>
      </Stack>
    </Box>
  )
}
