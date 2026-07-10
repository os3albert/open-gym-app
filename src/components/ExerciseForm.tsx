import { useState, type FormEvent } from 'react'
import type { NewExercise } from '../domain/exercises'

interface Props {
  /** Ritorna true se l'esercizio è stato accettato (il form si svuota). */
  onSubmit: (input: NewExercise) => boolean
  error: string | null
}

export function ExerciseForm({ onSubmit, error }: Props) {
  const [name, setName] = useState('')
  const [muscleGroup, setMuscleGroup] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [description, setDescription] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const accepted = onSubmit({ name, muscleGroup, youtubeUrl, description })
    if (accepted) {
      setName('')
      setMuscleGroup('')
      setYoutubeUrl('')
      setDescription('')
    }
  }

  return (
    <section className="card">
      <h2>Proponi un esercizio</h2>
      <p className="hint">
        Carica il link di un video YouTube con il volto offuscato dall'AI: si valuta l'esercizio,
        non la persona.
      </p>
      <form onSubmit={handleSubmit}>
        <label>
          Nome esercizio
          <input
            data-cy="exercise-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label>
          Gruppo muscolare
          <input
            data-cy="exercise-muscle"
            value={muscleGroup}
            onChange={(e) => setMuscleGroup(e.target.value)}
          />
        </label>
        <label>
          Link YouTube (volto offuscato)
          <input
            data-cy="exercise-youtube"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            required
          />
        </label>
        <label>
          Descrizione
          <textarea
            data-cy="exercise-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </label>
        {error && (
          <p role="alert" data-cy="form-error" className="error">
            {error}
          </p>
        )}
        <button type="submit" data-cy="exercise-submit">
          Proponi esercizio
        </button>
      </form>
    </section>
  )
}
