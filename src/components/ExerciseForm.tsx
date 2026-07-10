import { useState, type FormEvent } from 'react'
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
    <section className="card">
      <h2>{initial ? 'Modifica esercizio' : 'Proponi un esercizio'}</h2>
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
        <div className="stature-fields">
          <label>
            Statura consigliata da (cm)
            <input
              type="number"
              data-cy="exercise-stature-min"
              value={statureMin}
              onChange={(e) => setStatureMin(e.target.value)}
              placeholder="es. 170"
            />
          </label>
          <label>
            a (cm)
            <input
              type="number"
              data-cy="exercise-stature-max"
              value={statureMax}
              onChange={(e) => setStatureMax(e.target.value)}
              placeholder="es. 190"
            />
          </label>
        </div>
        <p className="hint">Lascia vuota la fascia di statura se l'esercizio è adatto a tutti.</p>
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
        {previewVideoId && (
          <img
            className="video-preview"
            data-cy="video-preview"
            src={youtubeThumbnailUrl(previewVideoId)}
            alt="Anteprima del video YouTube"
          />
        )}
        <label>
          Descrizione
          <textarea
            data-cy="exercise-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </label>
        <details className="guidelines" data-cy="video-guidelines">
          <summary>Linee guida video (volto offuscato)</summary>
          <ul>
            <li>
              Su YouTube Studio: Editor → Sfoca → «Sfocatura viso», rileva e segue i volti
              automaticamente (gratuito).
            </li>
            <li>In alternativa: app di editing con blur AI (es. CapCut) prima del caricamento.</li>
            <li>Il video deve mostrare l'esecuzione completa dell'esercizio.</li>
            <li>Carica come «Non in elenco» se non vuoi che appaia nel tuo canale.</li>
          </ul>
        </details>
        <label className="checkbox-label">
          <input
            type="checkbox"
            data-cy="face-blur-checkbox"
            checked={faceBlurConfirmed}
            onChange={(e) => setFaceBlurConfirmed(e.target.checked)}
          />
          Confermo che il volto nel video è offuscato
        </label>
        {error && (
          <p role="alert" data-cy="form-error" className="error">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button type="submit" data-cy="exercise-submit" disabled={!faceBlurConfirmed}>
            {initial ? 'Salva modifiche' : 'Proponi esercizio'}
          </button>
          {initial && onCancel && (
            <button type="button" className="btn-ghost" data-cy="edit-cancel" onClick={onCancel}>
              Annulla modifica
            </button>
          )}
        </div>
      </form>
    </section>
  )
}
