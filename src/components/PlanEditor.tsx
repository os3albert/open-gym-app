import { useState } from 'react'
import type { Exercise, PlanEntry, WorkoutDay, WorkoutPlan } from '../domain/types'
import { WEEKDAYS_IT } from '../utils/date'

export interface PlanEditorActions {
  renamePlan: (planId: string, name: string) => void
  addPlanDay: (planId: string, dayName: string) => void
  removePlanDay: (planId: string, dayName: string) => void
  addPlanEntry: (planId: string, dayName: string, entry: PlanEntry) => void
  removePlanEntry: (planId: string, dayName: string, exerciseId: string) => void
  movePlanEntry: (planId: string, dayName: string, exerciseId: string, direction: -1 | 1) => void
}

interface Props {
  plan: WorkoutPlan
  exercises: Exercise[]
  actions: PlanEditorActions
  onClose: () => void
}

const DAY_SUGGESTIONS = [...WEEKDAYS_IT, 'Giorno A', 'Giorno B', 'Giorno C']

/** Editor di una scheda: giorni (della settimana o generici) ed esercizi con target serie×reps. */
export function PlanEditor({ plan, exercises, actions, onClose }: Props) {
  const [name, setName] = useState(plan.name)
  const [dayName, setDayName] = useState('')
  const [error, setError] = useState<string | null>(null)

  function attempt(action: () => void) {
    try {
      action()
      setError(null)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operazione non valida')
      return false
    }
  }

  return (
    <section className="card" data-cy="plan-editor">
      <h2>Modifica scheda</h2>
      <div className="plan-rename">
        <label>
          Nome della scheda
          <input
            data-cy="plan-rename-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="btn-ghost btn-small"
          data-cy="plan-rename"
          onClick={() => attempt(() => actions.renamePlan(plan.id, name))}
        >
          Rinomina
        </button>
      </div>

      <div className="plan-add-day">
        <label>
          Nuovo giorno
          <input
            data-cy="day-name-input"
            list="day-suggestions"
            placeholder="Lunedì, Giorno A…"
            value={dayName}
            onChange={(e) => setDayName(e.target.value)}
          />
        </label>
        <datalist id="day-suggestions">
          {DAY_SUGGESTIONS.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
        <button
          type="button"
          data-cy="add-day"
          onClick={() => {
            if (attempt(() => actions.addPlanDay(plan.id, dayName))) setDayName('')
          }}
        >
          Aggiungi giorno
        </button>
      </div>

      {error && (
        <p role="alert" data-cy="editor-error" className="error">
          {error}
        </p>
      )}

      {plan.days.length === 0 && (
        <p className="hint">Nessun giorno: aggiungi «Lunedì» o «Giorno A» per iniziare.</p>
      )}
      {plan.days.map((day) => (
        <DayEditor
          key={day.name}
          day={day}
          exercises={exercises}
          onAddEntry={(entry) => attempt(() => actions.addPlanEntry(plan.id, day.name, entry))}
          onRemoveEntry={(exerciseId) =>
            attempt(() => actions.removePlanEntry(plan.id, day.name, exerciseId))
          }
          onMoveEntry={(exerciseId, direction) =>
            attempt(() => actions.movePlanEntry(plan.id, day.name, exerciseId, direction))
          }
          onRemoveDay={() => attempt(() => actions.removePlanDay(plan.id, day.name))}
        />
      ))}

      <div className="card-actions">
        <button type="button" className="btn-ghost" data-cy="plan-editor-close" onClick={onClose}>
          Chiudi editor
        </button>
      </div>
    </section>
  )
}

interface DayProps {
  day: WorkoutDay
  exercises: Exercise[]
  onAddEntry: (entry: PlanEntry) => boolean
  onRemoveEntry: (exerciseId: string) => void
  onMoveEntry: (exerciseId: string, direction: -1 | 1) => void
  onRemoveDay: () => void
}

function DayEditor({
  day,
  exercises,
  onAddEntry,
  onRemoveEntry,
  onMoveEntry,
  onRemoveDay,
}: DayProps) {
  const [exerciseId, setExerciseId] = useState('')
  const [sets, setSets] = useState('3')
  const [reps, setReps] = useState('8')

  const exercisesByName = [...exercises].sort((a, b) => a.name.localeCompare(b.name))
  const exerciseName = (id: string) => exercises.find((e) => e.id === id)?.name ?? id

  return (
    <div className="plan-day" data-cy="plan-day">
      <div className="plan-day-header">
        <h3 data-cy="plan-day-name">{day.name}</h3>
        <button
          type="button"
          className="btn-ghost btn-small"
          data-cy="remove-day"
          aria-label={`Rimuovi il giorno ${day.name}`}
          onClick={onRemoveDay}
        >
          Rimuovi giorno
        </button>
      </div>

      {day.entries.length === 0 ? (
        <p className="hint">Nessun esercizio in questo giorno.</p>
      ) : (
        <ul className="plan-entries">
          {day.entries.map((entry, index) => (
            <li key={entry.exerciseId} data-cy="plan-entry">
              <span data-cy="plan-entry-text">
                {exerciseName(entry.exerciseId)} — {entry.sets}×{entry.reps}
              </span>
              <span className="entry-actions">
                <button
                  type="button"
                  className="btn-ghost btn-small"
                  data-cy="entry-up"
                  aria-label={`Sposta su ${exerciseName(entry.exerciseId)} in ${day.name}`}
                  disabled={index === 0}
                  onClick={() => onMoveEntry(entry.exerciseId, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="btn-ghost btn-small"
                  data-cy="entry-down"
                  aria-label={`Sposta giù ${exerciseName(entry.exerciseId)} in ${day.name}`}
                  disabled={index === day.entries.length - 1}
                  onClick={() => onMoveEntry(entry.exerciseId, 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="btn-ghost btn-small"
                  data-cy="remove-entry"
                  aria-label={`Rimuovi ${exerciseName(entry.exerciseId)} da ${day.name}`}
                  onClick={() => onRemoveEntry(entry.exerciseId)}
                >
                  ×
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="plan-add-entry">
        <label>
          Esercizio
          <select
            data-cy="entry-exercise-select"
            value={exerciseId}
            onChange={(e) => setExerciseId(e.target.value)}
          >
            <option value="">Scegli un esercizio…</option>
            {exercisesByName.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Serie
          <input
            type="number"
            data-cy="entry-sets"
            value={sets}
            onChange={(e) => setSets(e.target.value)}
          />
        </label>
        <label>
          Ripetizioni
          <input
            type="number"
            data-cy="entry-reps"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
          />
        </label>
        <button
          type="button"
          data-cy="add-entry"
          disabled={!exerciseId}
          onClick={() => {
            if (onAddEntry({ exerciseId, sets: Number(sets), reps: Number(reps) })) {
              setExerciseId('')
            }
          }}
        >
          Aggiungi
        </button>
      </div>
    </div>
  )
}
