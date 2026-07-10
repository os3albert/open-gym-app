import { rankExercises } from '../domain/exercises'
import type { Exercise } from '../domain/types'
import { parseYouTubeVideoId, youtubeWatchUrl } from '../services/youtube'

interface Props {
  exercises: Exercise[]
  onUpvote: (exerciseId: string) => void
}

export function ExerciseList({ exercises, onUpvote }: Props) {
  if (exercises.length === 0) {
    return (
      <section className="card">
        <h2>Esercizi della community</h2>
        <p data-cy="empty-state">Nessun esercizio proposto finora. Proponi tu il primo!</p>
      </section>
    )
  }

  return (
    <section className="card">
      <h2>Esercizi della community</h2>
      <ul className="exercise-list" data-cy="exercise-list">
        {rankExercises(exercises).map((exercise) => {
          const videoId = parseYouTubeVideoId(exercise.youtubeUrl)
          return (
            <li key={exercise.id} className="exercise-item" data-cy="exercise-item">
              <div className="exercise-votes">
                <button
                  type="button"
                  data-cy="exercise-upvote"
                  aria-label={`Vota ${exercise.name}`}
                  onClick={() => onUpvote(exercise.id)}
                >
                  ▲
                </button>
                <span data-cy="exercise-votes">{exercise.votes}</span>
              </div>
              <div className="exercise-body">
                <h3>{exercise.name}</h3>
                {exercise.muscleGroup && <span className="badge">{exercise.muscleGroup}</span>}
                {exercise.description && <p>{exercise.description}</p>}
                {videoId && (
                  <a href={youtubeWatchUrl(videoId)} target="_blank" rel="noreferrer">
                    Guarda su YouTube
                  </a>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
