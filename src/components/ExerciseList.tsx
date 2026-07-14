import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { Difficulty, Exercise } from '../domain/types'
import { useT } from '../i18n/context'
import type { DisplayExercise } from '../services/community'
import { encodeExerciseShare } from '../services/share'
import { parseYouTubeVideoId } from '../services/youtube'
import { ShareCodeBox } from './ShareCodeBox'
import { YouTubePlayer } from './YouTubePlayer'

interface Props {
  /** Esercizi già filtrati e ordinati dal chiamante (locali e/o della community). */
  exercises: DisplayExercise[]
  totalCount: number
  votedIds: ReadonlySet<string>
  onToggleVote: (exerciseId: string) => void
  onEdit: (exercise: Exercise) => void
  onDelete: (exerciseId: string) => void
}

/**
 * Un colore per grado, con lo stesso significato ovunque: verde = facile, ambra = media,
 * rosso = difficile. Sono bordo e testo di un chip, non riempimenti: il contrasto regge in
 * entrambi i temi senza doverli raddoppiare.
 */
const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: 'var(--mui-palette-success-main)',
  medium: 'var(--mui-palette-warning-main)',
  hard: 'var(--mui-palette-error-main)',
}

/** Riquadro tratteggiato per le liste vuote (il testo resta contratto dei test). */
function EmptyState({ dataCy, children }: { dataCy: string; children: React.ReactNode }) {
  return (
    <Typography
      data-cy={dataCy}
      color="text.secondary"
      sx={{
        py: 5,
        px: 2,
        textAlign: 'center',
        borderRadius: '20px',
        border: '1px dashed',
        borderColor: 'divider',
      }}
    >
      {children}
    </Typography>
  )
}

export function ExerciseList({
  exercises,
  totalCount,
  votedIds,
  onToggleVote,
  onEdit,
  onDelete,
}: Props) {
  const t = useT()
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)
  const [sharingId, setSharingId] = useState<string | null>(null)

  if (totalCount === 0) {
    return <EmptyState dataCy="empty-state">{t('list.empty')}</EmptyState>
  }
  if (exercises.length === 0) {
    return <EmptyState dataCy="no-results">{t('list.noResults')}</EmptyState>
  }

  return (
    <Box
      component="ul"
      data-cy="exercise-list"
      sx={{
        listStyle: 'none',
        m: 0,
        p: 0,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: 2,
        alignItems: 'start',
      }}
    >
      {exercises.map((exercise) => {
        const videoId = parseYouTubeVideoId(exercise.youtubeUrl)
        const voted = votedIds.has(exercise.id)
        const confirming = confirmingDeleteId === exercise.id
        return (
          <Card key={exercise.id} component="li" data-cy="exercise-item" className="exercise-card">
            {videoId && <YouTubePlayer videoId={videoId} title={exercise.name} />}
            <CardContent sx={{ pb: 0 }}>
              <Stack
                direction="row"
                spacing={1.5}
                sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
              >
                <Typography variant="h3" component="h3" sx={{ pt: 0.5 }}>
                  {exercise.name}
                </Typography>
                {/* Upvote stile Reddit: un voto per dispositivo, toggle */}
                <Button
                  size="small"
                  variant={voted ? 'contained' : 'outlined'}
                  className={voted ? 'vote-button voted' : 'vote-button'}
                  data-cy="exercise-upvote"
                  aria-pressed={voted}
                  aria-label={
                    voted
                      ? t('list.removeVote', { name: exercise.name })
                      : t('list.vote', { name: exercise.name })
                  }
                  onClick={() => onToggleVote(exercise.id)}
                  sx={{
                    // Colonnina freccia+conteggio: la stessa gestualità di Reddit
                    flexDirection: 'column',
                    gap: 0,
                    minWidth: 52,
                    px: 0.5,
                    py: 0.75,
                    borderRadius: '14px',
                    flexShrink: 0,
                    lineHeight: 1.15,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  <Box component="span" aria-hidden sx={{ fontSize: '0.75rem' }}>
                    ▲
                  </Box>
                  <span data-cy="exercise-votes">{exercise.votes}</span>
                </Button>
              </Stack>
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mt: 1 }}>
                {exercise.fromCommunity && (
                  <Chip
                    size="small"
                    color="primary"
                    variant="outlined"
                    data-cy="community-badge"
                    label="community"
                  />
                )}
                <Chip
                  size="small"
                  variant="outlined"
                  data-cy="difficulty-badge"
                  label={t(`difficulty.${exercise.difficulty}`)}
                  sx={{
                    borderColor: DIFFICULTY_COLORS[exercise.difficulty],
                    color: DIFFICULTY_COLORS[exercise.difficulty],
                  }}
                />
                {exercise.muscleGroup && <Chip size="small" label={exercise.muscleGroup} />}
                {exercise.stature && (
                  <Chip
                    size="small"
                    variant="outlined"
                    data-cy="stature-badge"
                    label={`${exercise.stature.minCm}–${exercise.stature.maxCm} cm`}
                  />
                )}
              </Stack>
              {exercise.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                  {exercise.description}
                </Typography>
              )}
            </CardContent>
            <CardActions
              sx={{
                px: 1.5,
                pt: 1.5,
                pb: 1.5,
                mt: 2,
                flexWrap: 'wrap',
                gap: 0.5,
                borderTop: 1,
                borderColor: 'divider',
              }}
            >
              {/* Gli esercizi della community non sono miei: si votano e si condividono, non si modificano */}
              {!exercise.fromCommunity && (
                <Button
                  size="small"
                  color="inherit"
                  data-cy="exercise-edit"
                  onClick={() => {
                    setConfirmingDeleteId(null)
                    onEdit(exercise)
                  }}
                >
                  {t('list.edit')}
                </Button>
              )}
              <Button
                size="small"
                color="inherit"
                data-cy="exercise-share"
                onClick={() => setSharingId(sharingId === exercise.id ? null : exercise.id)}
              >
                {t('list.share')}
              </Button>
              {exercise.fromCommunity ? null : confirming ? (
                <>
                  <Button
                    size="small"
                    variant="contained"
                    color="error"
                    data-cy="exercise-delete-confirm"
                    onClick={() => {
                      setConfirmingDeleteId(null)
                      onDelete(exercise.id)
                    }}
                  >
                    {t('list.confirmDelete')}
                  </Button>
                  <Button
                    size="small"
                    color="inherit"
                    data-cy="exercise-delete-cancel"
                    onClick={() => setConfirmingDeleteId(null)}
                  >
                    {t('list.cancel')}
                  </Button>
                </>
              ) : (
                <Button
                  size="small"
                  color="inherit"
                  data-cy="exercise-delete"
                  onClick={() => setConfirmingDeleteId(exercise.id)}
                >
                  {t('list.delete')}
                </Button>
              )}
            </CardActions>
            {sharingId === exercise.id && (
              <Box sx={{ px: 2, pb: 2 }}>
                <ShareCodeBox code={encodeExerciseShare(exercise)} />
              </Box>
            )}
          </Card>
        )
      })}
    </Box>
  )
}
