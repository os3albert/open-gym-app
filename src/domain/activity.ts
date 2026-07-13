import { addDaysIso } from '../utils/date'
import { generateId } from '../utils/id'
import type { ActivityRecord, AppData, WorkoutSet } from './types'

export const INVALID_SET_ERROR = 'INVALID_SET'
export const EXERCISE_NOT_FOUND_ERROR = 'EXERCISE_NOT_FOUND'

function isValidSet(set: WorkoutSet): boolean {
  return (
    Number.isFinite(set.weightKg) &&
    set.weightKg >= 0 &&
    Number.isInteger(set.reps) &&
    set.reps >= 1
  )
}

/** Registra una serie nella sessione (esercizio, giorno): appende al record del giorno o lo crea. */
export function recordSet(
  data: AppData,
  exerciseId: string,
  date: string,
  set: WorkoutSet,
): AppData {
  if (!isValidSet(set)) throw new Error(INVALID_SET_ERROR)
  if (!data.exercises.some((e) => e.id === exerciseId)) throw new Error(EXERCISE_NOT_FOUND_ERROR)

  const existing = data.activity.find((a) => a.exerciseId === exerciseId && a.date === date)
  if (existing) {
    return {
      ...data,
      activity: data.activity.map((a) =>
        a.id === existing.id ? { ...a, sets: [...a.sets, set] } : a,
      ),
    }
  }
  return {
    ...data,
    activity: [...data.activity, { id: generateId(), exerciseId, date, sets: [set] }],
  }
}

/** Rimuove una serie; un record rimasto senza serie viene eliminato. */
export function removeSet(data: AppData, recordId: string, setIndex: number): AppData {
  return {
    ...data,
    activity: data.activity
      .map((a) => (a.id === recordId ? { ...a, sets: a.sets.filter((_, i) => i !== setIndex) } : a))
      .filter((a) => a.sets.length > 0),
  }
}

export interface DaySession {
  date: string
  records: ActivityRecord[]
}

/** Sessioni raggruppate per giorno, dalla più recente. */
export function sessionsByDate(activity: ActivityRecord[]): DaySession[] {
  const byDate = new Map<string, ActivityRecord[]>()
  for (const record of activity) {
    byDate.set(record.date, [...(byDate.get(record.date) ?? []), record])
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, records]) => ({ date, records }))
}

/** L'ultima sessione registrata per un esercizio (per precompilare le ripetizioni). */
export function lastSession(activity: ActivityRecord[], exerciseId: string): ActivityRecord | null {
  const sessions = activity.filter((a) => a.exerciseId === exerciseId && a.sets.length > 0)
  if (sessions.length === 0) return null
  return sessions.reduce((a, b) => (a.date >= b.date ? a : b))
}

/** Cosa si misura nel grafico dello storico: non solo il carico, anche il lavoro svolto. */
export type TrendMetric = 'maxWeight' | 'totalReps' | 'maxReps' | 'volume'

export interface TrendPoint {
  date: string
  value: number
}

/** Aggrega le serie di un giorno secondo la metrica scelta. */
function aggregate(sets: WorkoutSet[], metric: TrendMetric): number {
  switch (metric) {
    case 'maxWeight':
      return Math.max(...sets.map((s) => s.weightKg))
    case 'totalReps':
      return sets.reduce((sum, s) => sum + s.reps, 0)
    case 'maxReps':
      return Math.max(...sets.map((s) => s.reps))
    case 'volume':
      return sets.reduce((sum, s) => sum + s.weightKg * s.reps, 0)
  }
}

/**
 * Andamento di un esercizio per giorno, in ordine cronologico.
 * Un giorno può avere più record (raro ma possibile): le serie si uniscono prima di aggregare.
 */
export function exerciseHistory(
  activity: ActivityRecord[],
  exerciseId: string,
  metric: TrendMetric = 'maxWeight',
): TrendPoint[] {
  const byDate = new Map<string, WorkoutSet[]>()
  for (const record of activity) {
    if (record.exerciseId !== exerciseId || record.sets.length === 0) continue
    byDate.set(record.date, [...(byDate.get(record.date) ?? []), ...record.sets])
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, sets]) => ({ date, value: aggregate(sets, metric) }))
}

/** Limita l'andamento agli ultimi N giorni; null = tutto lo storico. */
export function filterByPeriod(
  points: TrendPoint[],
  days: number | null,
  today: string,
): TrendPoint[] {
  if (days === null) return points
  const cutoff = addDaysIso(today, -days)
  return points.filter((p) => p.date >= cutoff)
}
