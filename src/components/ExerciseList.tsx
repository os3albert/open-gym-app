import { useState } from 'react'
import type { Exercise } from '../domain/types'
import { parseYouTubeVideoId } from '../services/youtube'
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

  if (totalCount === 0) {
    return <p data-cy="empty-state">Nessun esercizio proposto finora. Proponi tu il primo!</p>
  }
  if (exercises.length === 0) {
    return <p data-cy="no-results">Nessun esercizio corrisponde ai filtri scelti.</p>
  }

  return (
    <ul className="exercise-list" data-cy="exercise-list">
      {exercises.map((exercise) => {
        const videoId = parseYouTubeVideoId(exercise.youtubeUrl)
        const voted = votedIds.has(exercise.id)
        const confirming = confirmingDeleteId === exercise.id
        return (
          <li key={exercise.id} className="exercise-item" data-cy="exercise-item">
            <div className="exercise-votes">
              <button
                type="button"
                data-cy="exercise-upvote"
                className={voted ? 'vote-button voted' : 'vote-button'}
                aria-pressed={voted}
                aria-label={voted ? `Rimuovi il voto a ${exercise.name}` : `Vota ${exercise.name}`}
                onClick={() => onToggleVote(exercise.id)}
              >
                ▲
              </button>
              <span data-cy="exercise-votes">{exercise.votes}</span>
            </div>
            <div className="exercise-body">
              <h3>{exercise.name}</h3>
              <p className="badges">
                {exercise.muscleGroup && <span className="badge">{exercise.muscleGroup}</span>}
                {exercise.stature && (
                  <span className="badge" data-cy="stature-badge">
                    {exercise.stature.minCm}–{exercise.stature.maxCm} cm
                  </span>
                )}
                {exercise.faceBlurConfirmed && (
                  <span className="badge badge-ok" data-cy="face-blur-badge">
                    ✓ volto offuscato
                  </span>
                )}
              </p>
              {exercise.description && <p>{exercise.description}</p>}
              {videoId && <YouTubePlayer videoId={videoId} title={exercise.name} />}
              <div className="card-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  data-cy="exercise-edit"
                  onClick={() => {
                    setConfirmingDeleteId(null)
                    onEdit(exercise)
                  }}
                >
                  Modifica
                </button>
                {confirming ? (
                  <>
                    <button
                      type="button"
                      className="btn-danger"
                      data-cy="exercise-delete-confirm"
                      onClick={() => {
                        setConfirmingDeleteId(null)
                        onDelete(exercise.id)
                      }}
                    >
                      Conferma eliminazione
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      data-cy="exercise-delete-cancel"
                      onClick={() => setConfirmingDeleteId(null)}
                    >
                      Annulla
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn-ghost"
                    data-cy="exercise-delete"
                    onClick={() => setConfirmingDeleteId(exercise.id)}
                  >
                    Elimina
                  </button>
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
