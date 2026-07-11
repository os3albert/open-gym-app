import { useState } from 'react'
import { activePlan, dayForDate, nextScheduledDay, planUsesWeekdays } from '../domain/plans'
import type { AppData, Exercise, PlanEntry, WorkoutSet } from '../domain/types'
import { suggestNextWeight } from '../services/weightSuggestion'
import { formatDateIt } from '../utils/date'

interface Props {
  data: AppData
  today: string
  /** Registra tutte le serie previste dall'esercizio della scheda. Lancia se non valide. */
  onComplete: (exerciseId: string, sets: number, set: WorkoutSet) => void
}

/**
 * L'allenamento del giorno dalla scheda attiva (issue #19): esercizi previsti oggi,
 * peso proposto dallo storico, «Fatto ✓» che registra la sessione nello storico.
 */
export function TodayWorkout({ data, today, onComplete }: Props) {
  const [manualDayName, setManualDayName] = useState('')
  const plan = activePlan(data)
  if (!plan || plan.days.length === 0) return null

  const autoDay = dayForDate(plan, today)
  const day = autoDay ?? plan.days.find((d) => d.name === manualDayName) ?? null
  const restDay = !autoDay && planUsesWeekdays(plan)
  const next = restDay ? nextScheduledDay(plan, today) : null

  return (
    <section className="card" data-cy="today-workout">
      <h2>La tua scheda: {plan.name}</h2>

      {restDay && !day && (
        <p data-cy="rest-day">
          Oggi riposo 💤{' '}
          {next && (
            <span data-cy="next-workout">
              Prossimo allenamento: <strong>{next.day.name}</strong> ({formatDateIt(next.date)})
            </span>
          )}
        </p>
      )}

      {!autoDay && (
        <label>
          {restDay ? 'Ti alleni lo stesso? Scegli il giorno' : 'Che giorno della scheda fai oggi?'}
          <select
            data-cy="today-day-select"
            value={manualDayName}
            onChange={(e) => setManualDayName(e.target.value)}
          >
            <option value="">Scegli…</option>
            {plan.days.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {day && (
        <>
          <p className="hint" data-cy="today-day-name">
            {day.name} — spunta gli esercizi man mano che li completi.
          </p>
          {day.entries.length === 0 ? (
            <p className="hint">Questo giorno non ha esercizi: aggiungili dalla scheda.</p>
          ) : (
            <ul className="today-entries">
              {day.entries.map((entry) => {
                const exercise = data.exercises.find((e) => e.id === entry.exerciseId)
                if (!exercise) return null
                const done = data.activity.some(
                  (a) => a.exerciseId === entry.exerciseId && a.date === today,
                )
                return (
                  <TodayEntry
                    key={entry.exerciseId}
                    exercise={exercise}
                    entry={entry}
                    done={done}
                    suggestedWeight={suggestNextWeight(data.activity, entry.exerciseId)}
                    onComplete={onComplete}
                  />
                )
              })}
            </ul>
          )}
        </>
      )}
    </section>
  )
}

interface EntryProps {
  exercise: Exercise
  entry: PlanEntry
  done: boolean
  suggestedWeight: number | null
  onComplete: (exerciseId: string, sets: number, set: WorkoutSet) => void
}

function TodayEntry({ exercise, entry, done, suggestedWeight, onComplete }: EntryProps) {
  const [weight, setWeight] = useState(suggestedWeight === null ? '' : String(suggestedWeight))
  const [reps, setReps] = useState(String(entry.reps))
  const [skipped, setSkipped] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleComplete() {
    try {
      onComplete(exercise.id, entry.sets, { weightKg: Number(weight), reps: Number(reps) })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Serie non valida')
    }
  }

  return (
    <li className="today-entry" data-cy="today-entry">
      <div className="today-entry-info">
        <strong>{exercise.name}</strong>{' '}
        <span className="hint" data-cy="today-entry-target">
          {entry.sets}×{entry.reps}
        </span>
      </div>
      {done ? (
        <span className="badge badge-ok" data-cy="today-entry-done">
          ✓ Registrato oggi
        </span>
      ) : skipped ? (
        <span data-cy="today-entry-skipped">
          Saltato per oggi{' '}
          <button
            type="button"
            className="btn-ghost btn-small"
            data-cy="today-entry-unskip"
            onClick={() => setSkipped(false)}
          >
            Annulla
          </button>
        </span>
      ) : (
        <div className="today-entry-controls">
          <label>
            Peso (kg)
            <input
              type="number"
              step="0.5"
              data-cy="today-weight"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </label>
          <label>
            Ripetizioni
            <input
              type="number"
              data-cy="today-reps"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
            />
          </label>
          <button type="button" data-cy="today-entry-complete" onClick={handleComplete}>
            Fatto ✓
          </button>
          <button
            type="button"
            className="btn-ghost btn-small"
            data-cy="today-entry-skip"
            onClick={() => setSkipped(true)}
          >
            Salta
          </button>
          {error && (
            <p role="alert" className="error" data-cy="today-entry-error">
              {error}
            </p>
          )}
        </div>
      )}
    </li>
  )
}
