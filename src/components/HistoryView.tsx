import { useState } from 'react'
import { exerciseHistory, filterByPeriod, sessionsByDate } from '../domain/activity'
import type { AppData } from '../domain/types'
import { formatDateIt, todayIso } from '../utils/date'
import { TrendChart } from './TrendChart'

interface Props {
  data: AppData
}

const PERIODS = [
  { value: '', label: 'Tutto lo storico', days: null },
  { value: '30', label: 'Ultimi 30 giorni', days: 30 },
  { value: '90', label: 'Ultimi 90 giorni', days: 90 },
] as const

export function HistoryView({ data }: Props) {
  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const [period, setPeriod] = useState<string>('')

  const sessions = sessionsByDate(data.activity)
  const exerciseName = (id: string) => data.exercises.find((e) => e.id === id)?.name ?? id
  const trackedExercises = data.exercises
    .filter((e) => data.activity.some((a) => a.exerciseId === e.id))
    .sort((a, b) => a.name.localeCompare(b.name))

  if (sessions.length === 0) {
    return (
      <section className="card">
        <h2>Storico allenamenti</h2>
        <p data-cy="history-empty">
          Nessuna sessione registrata: inizia dalla scheda «Allenamento».
        </p>
      </section>
    )
  }

  const days = PERIODS.find((p) => p.value === period)?.days ?? null
  const trend = selectedExerciseId
    ? filterByPeriod(exerciseHistory(data.activity, selectedExerciseId), days, todayIso())
    : []

  return (
    <>
      <section className="card">
        <h2>Andamento del carico</h2>
        <div className="filters-row">
          <label>
            Esercizio
            <select
              data-cy="history-exercise-select"
              value={selectedExerciseId}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
            >
              <option value="">Scegli un esercizio…</option>
              {trackedExercises.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Periodo
            <select
              data-cy="period-select"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {selectedExerciseId ? (
          <TrendChart points={trend} />
        ) : (
          <p className="hint">Scegli un esercizio per vedere l'andamento del peso nel tempo.</p>
        )}
      </section>
      <section className="card">
        <h2>Storico allenamenti</h2>
        <ul className="history-list">
          {sessions.map((session) => (
            <li key={session.date} data-cy="session-item">
              <h3>{formatDateIt(session.date)}</h3>
              <ul>
                {session.records.map((record) => (
                  <li key={record.id} data-cy="session-exercise">
                    <strong>{exerciseName(record.exerciseId)}</strong>:{' '}
                    {record.sets.map((s) => `${s.weightKg} kg × ${s.reps}`).join(', ')}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
