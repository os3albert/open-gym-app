import { addDaysIso } from '../utils/date'
import { generateId } from '../utils/id'
import type { ActivityRecord, AppData, WorkoutSet } from './types'

export const INVALID_SET_ERROR = 'Serie non valida: servono almeno 1 ripetizione e un peso ≥ 0'
export const EXERCISE_NOT_FOUND_ERROR = 'Esercizio non trovato'

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

export interface TrendPoint {
  date: string
  maxWeightKg: number
}

/** Andamento del carico: peso massimo per giorno, in ordine cronologico. */
export function exerciseHistory(activity: ActivityRecord[], exerciseId: string): TrendPoint[] {
  const byDate = new Map<string, number>()
  for (const record of activity) {
    if (record.exerciseId !== exerciseId || record.sets.length === 0) continue
    const max = Math.max(...record.sets.map((s) => s.weightKg))
    byDate.set(record.date, Math.max(byDate.get(record.date) ?? 0, max))
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, maxWeightKg]) => ({ date, maxWeightKg }))
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
