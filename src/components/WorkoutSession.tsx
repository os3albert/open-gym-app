import { useState } from 'react'
import { lastSession, sessionsByDate } from '../domain/activity'
import type { AppData, WorkoutSet } from '../domain/types'
import { suggestNextWeight } from '../services/weightSuggestion'
import { formatDateIt } from '../utils/date'

interface Props {
  data: AppData
  today: string
  /** Lancia un errore se la serie non è valida. */
  onAddSet: (exerciseId: string, set: WorkoutSet) => void
  onRemoveSet: (recordId: string, setIndex: number) => void
}

/** Registrazione della sessione di oggi: pensata per l'uso in palestra (+/- rapidi, valori proposti). */
export function WorkoutSession({ data, today, onAddSet, onRemoveSet }: Props) {
  const [exerciseId, setExerciseId] = useState('')
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [error, setError] = useState<string | null>(null)

  const exercisesByName = [...data.exercises].sort((a, b) => a.name.localeCompare(b.name))
  const todayRecords = sessionsByDate(data.activity).find((s) => s.date === today)?.records ?? []
  const exerciseName = (id: string) => data.exercises.find((e) => e.id === id)?.name ?? id

  function handleSelectExercise(id: string) {
    setExerciseId(id)
    setError(null)
    if (!id) return
    // Il carico viene proposto dallo storico (issue #16); senza storico i campi restano vuoti
    const suggested = suggestNextWeight(data.activity, id)
    setWeight(suggested === null ? '' : String(suggested))
    const last = lastSession(data.activity, id)
    setReps(last === null ? '' : String(last.sets[last.sets.length - 1].reps))
  }

  function step(value: string, delta: number, min: number): string {
    const next = Math.max(min, (Number(value) || 0) + delta)
    return String(Math.round(next * 10) / 10)
  }

  function handleAddSet() {
    try {
      onAddSet(exerciseId, { weightKg: Number(weight), reps: Number(reps) })
      setError(null)
      // Peso e ripetizioni restano compilati: la prossima serie si aggiunge con un tap
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Serie non valida')
    }
  }

  return (
    <section className="card">
      <h2>Allenamento di oggi</h2>
      <p className="hint">{formatDateIt(today)} — registra serie, ripetizioni e peso.</p>
      {exercisesByName.length === 0 ? (
        <p data-cy="session-no-exercises">
          Non c'è ancora nessun esercizio: proponine uno nella scheda «Esercizi».
        </p>
      ) : (
        <div className="session-form">
          <label>
            Esercizio
            <select
              data-cy="session-exercise-select"
              value={exerciseId}
              onChange={(e) => handleSelectExercise(e.target.value)}
            >
              <option value="">Scegli un esercizio…</option>
              {exercisesByName.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </label>
          <div className="set-inputs">
            <div className="stepper">
              <label>
                Peso (kg)
                <input
                  type="number"
                  step="0.5"
                  data-cy="set-weight"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="btn-ghost btn-small"
                data-cy="weight-minus"
                aria-label="Diminuisci il peso di 2,5 kg"
                onClick={() => setWeight((w) => step(w, -2.5, 0))}
              >
                −2,5
              </button>
              <button
                type="button"
                className="btn-ghost btn-small"
                data-cy="weight-plus"
                aria-label="Aumenta il peso di 2,5 kg"
                onClick={() => setWeight((w) => step(w, +2.5, 0))}
              >
                +2,5
              </button>
            </div>
            <div className="stepper">
              <label>
                Ripetizioni
                <input
                  type="number"
                  data-cy="set-reps"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="btn-ghost btn-small"
                data-cy="reps-minus"
                aria-label="Diminuisci le ripetizioni"
                onClick={() => setReps((r) => step(r, -1, 1))}
              >
                −1
              </button>
              <button
                type="button"
                className="btn-ghost btn-small"
                data-cy="reps-plus"
                aria-label="Aumenta le ripetizioni"
                onClick={() => setReps((r) => step(r, +1, 1))}
              >
                +1
              </button>
            </div>
          </div>
          {error && (
            <p role="alert" data-cy="session-error" className="error">
              {error}
            </p>
          )}
          <button type="button" data-cy="add-set" disabled={!exerciseId} onClick={handleAddSet}>
            Aggiungi serie
          </button>
        </div>
      )}

      {todayRecords.length > 0 && (
        <div className="today-session" data-cy="today-session">
          <h3>Serie registrate oggi</h3>
          <ul className="session-records">
            {todayRecords.map((record) => (
              <li key={record.id} data-cy="today-record">
                <strong>{exerciseName(record.exerciseId)}</strong>
                <span className="set-chips">
                  {record.sets.map((set, index) => (
                    <span className="set-chip" data-cy="set-chip" key={index}>
                      {set.weightKg} kg × {set.reps}
                      <button
                        type="button"
                        data-cy="remove-set"
                        aria-label={`Rimuovi la serie ${set.weightKg} kg × ${set.reps} di ${exerciseName(record.exerciseId)}`}
                        onClick={() => onRemoveSet(record.id, index)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
