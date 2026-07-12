import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { Exercise } from '../domain/types'
import { encodeExerciseShare } from '../services/share'
import { parseYouTubeVideoId } from '../services/youtube'
import { ShareCodeBox } from './ShareCodeBox'
import { YouTubePlayer } from './YouTubePlayer'

interface Props {
  /** Esercizi già filtrati e ordinati dal chiamante. */
  exercises: Exercise[]
  totalCount: number
  votedIds: ReadonlySet<string>
  onToggleVote: (exerciseId: string) => void
  onEdit: (exercise: Exercise) => void
  onDelete: (exerciseId: string) => void
}

export function ExerciseList({
  exercises,
  totalCount,
  votedIds,
  onToggleVote,
  onEdit,
  onDelete,
}: Props) {
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)
  const [sharingId, setSharingId] = useState<string | null>(null)

  if (totalCount === 0) {
    return (
      <Typography data-cy="empty-state">
        Nessun esercizio proposto finora. Proponi tu il primo!
      </Typography>
    )
  }
  if (exercises.length === 0) {
    return (
      <Typography data-cy="no-results">Nessun esercizio corrisponde ai filtri scelti.</Typography>
    )
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
          <Card key={exercise.id} component="li" data-cy="exercise-item">
            {videoId && <YouTubePlayer videoId={videoId} title={exercise.name} />}
            <CardContent sx={{ pb: 0 }}>
              <Stack
                direction="row"
                spacing={1}
                sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
              >
                <Typography variant="h3" component="h3">
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
                    voted ? `Rimuovi il voto a ${exercise.name}` : `Vota ${exercise.name}`
                  }
                  onClick={() => onToggleVote(exercise.id)}
                  sx={{ minWidth: 0, flexShrink: 0, gap: 0.5 }}
                >
                  ▲ <span data-cy="exercise-votes">{exercise.votes}</span>
                </Button>
              </Stack>
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mt: 1 }}>
                {exercise.muscleGroup && <Chip size="small" label={exercise.muscleGroup} />}
                {exercise.stature && (
                  <Chip
                    size="small"
                    variant="outlined"
                    data-cy="stature-badge"
                    label={`${exercise.stature.minCm}–${exercise.stature.maxCm} cm`}
                  />
                )}
                {exercise.faceBlurConfirmed && (
                  <Chip
                    size="small"
                    color="success"
                    variant="outlined"
                    data-cy="face-blur-badge"
                    label="✓ volto offuscato"
                  />
                )}
              </Stack>
              {exercise.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                  {exercise.description}
                </Typography>
              )}
            </CardContent>
            <CardActions sx={{ px: 2, pb: 2, flexWrap: 'wrap', gap: 0.5 }}>
              <Button
                size="small"
                color="inherit"
                data-cy="exercise-edit"
                onClick={() => {
                  setConfirmingDeleteId(null)
                  onEdit(exercise)
                }}
              >
                Modifica
              </Button>
              <Button
                size="small"
                color="inherit"
                data-cy="exercise-share"
                onClick={() => setSharingId(sharingId === exercise.id ? null : exercise.id)}
              >
                Condividi
              </Button>
              {confirming ? (
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
                    Conferma eliminazione
                  </Button>
                  <Button
                    size="small"
                    color="inherit"
                    data-cy="exercise-delete-cancel"
                    onClick={() => setConfirmingDeleteId(null)}
                  >
                    Annulla
                  </Button>
                </>
              ) : (
                <Button
                  size="small"
                  color="inherit"
                  data-cy="exercise-delete"
                  onClick={() => setConfirmingDeleteId(exercise.id)}
                >
                  Elimina
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
