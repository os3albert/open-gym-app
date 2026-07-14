import { addDaysIso, weekdayNameIt, WEEKDAYS_IT } from '../utils/date'
import { generateId } from '../utils/id'
import { EXERCISE_NOT_FOUND_ERROR } from './activity'
import type { AppData, PlanEntry, WorkoutDay, WorkoutPlan } from './types'

export const EMPTY_PLAN_NAME_ERROR = 'EMPTY_PLAN_NAME'
export const PLAN_NOT_FOUND_ERROR = 'PLAN_NOT_FOUND'
export const EMPTY_DAY_NAME_ERROR = 'EMPTY_DAY_NAME'
export const DUPLICATE_DAY_NAME_ERROR = 'DUPLICATE_DAY_NAME'
export const DAY_NOT_FOUND_ERROR = 'DAY_NOT_FOUND'
export const INVALID_TARGET_ERROR = 'INVALID_TARGET'
export const DUPLICATE_ENTRY_ERROR = 'DUPLICATE_ENTRY'

/** Applica una trasformazione alla scheda indicata; lancia se la scheda non esiste. */
function updatePlan(
  data: AppData,
  planId: string,
  transform: (plan: WorkoutPlan) => WorkoutPlan,
): AppData {
  if (!data.plans.some((p) => p.id === planId)) throw new Error(PLAN_NOT_FOUND_ERROR)
  return { ...data, plans: data.plans.map((p) => (p.id === planId ? transform(p) : p)) }
}

function findDay(plan: WorkoutPlan, dayName: string): WorkoutDay {
  const day = plan.days.find((d) => d.name === dayName)
  if (!day) throw new Error(DAY_NOT_FOUND_ERROR)
  return day
}

/** Crea una scheda vuota con il nome dato. Lancia se il nome è vuoto. */
export function createPlan(data: AppData, name: string): AppData {
  if (!name.trim()) throw new Error(EMPTY_PLAN_NAME_ERROR)
  const plan: WorkoutPlan = { id: generateId(), name: name.trim(), days: [], votes: 0 }
  return { ...data, plans: [...data.plans, plan] }
}

export function renamePlan(data: AppData, planId: string, name: string): AppData {
  if (!name.trim()) throw new Error(EMPTY_PLAN_NAME_ERROR)
  return updatePlan(data, planId, (p) => ({ ...p, name: name.trim() }))
}

/** Elimina la scheda; se era quella attiva, il dispositivo resta senza scheda attiva. */
export function deletePlan(data: AppData, planId: string): AppData {
  return {
    ...data,
    plans: data.plans.filter((p) => p.id !== planId),
    activePlanId: data.activePlanId === planId ? null : data.activePlanId,
  }
}

/** Imposta la scheda attiva del dispositivo (null = nessuna). Lancia se la scheda non esiste. */
export function setActivePlan(data: AppData, planId: string | null): AppData {
  if (planId !== null && !data.plans.some((p) => p.id === planId)) {
    throw new Error(PLAN_NOT_FOUND_ERROR)
  }
  return { ...data, activePlanId: planId }
}

export function activePlan(data: AppData): WorkoutPlan | null {
  return data.plans.find((p) => p.id === data.activePlanId) ?? null
}

/** Aggiunge un giorno alla scheda: nome obbligatorio e unico all'interno della scheda. */
export function addDay(data: AppData, planId: string, dayName: string): AppData {
  const name = dayName.trim()
  if (!name) throw new Error(EMPTY_DAY_NAME_ERROR)
  return updatePlan(data, planId, (plan) => {
    if (plan.days.some((d) => d.name.toLowerCase() === name.toLowerCase())) {
      throw new Error(DUPLICATE_DAY_NAME_ERROR)
    }
    return { ...plan, days: [...plan.days, { name, entries: [] }] }
  })
}

export function removeDay(data: AppData, planId: string, dayName: string): AppData {
  return updatePlan(data, planId, (plan) => ({
    ...plan,
    days: plan.days.filter((d) => d.name !== dayName),
  }))
}

function isValidTarget(entry: PlanEntry): boolean {
  return (
    Number.isInteger(entry.sets) &&
    entry.sets >= 1 &&
    Number.isInteger(entry.reps) &&
    entry.reps >= 1
  )
}

/** Aggiunge un esercizio (con target serie×ripetizioni) a un giorno della scheda. */
export function addEntry(
  data: AppData,
  planId: string,
  dayName: string,
  entry: PlanEntry,
): AppData {
  if (!isValidTarget(entry)) throw new Error(INVALID_TARGET_ERROR)
  if (!data.exercises.some((e) => e.id === entry.exerciseId)) {
    throw new Error(EXERCISE_NOT_FOUND_ERROR)
  }
  return updatePlan(data, planId, (plan) => {
    const day = findDay(plan, dayName)
    if (day.entries.some((e) => e.exerciseId === entry.exerciseId)) {
      throw new Error(DUPLICATE_ENTRY_ERROR)
    }
    return {
      ...plan,
      days: plan.days.map((d) =>
        d.name === dayName ? { ...d, entries: [...d.entries, entry] } : d,
      ),
    }
  })
}

export function removeEntry(
  data: AppData,
  planId: string,
  dayName: string,
  exerciseId: string,
): AppData {
  return updatePlan(data, planId, (plan) => {
    findDay(plan, dayName)
    return {
      ...plan,
      days: plan.days.map((d) =>
        d.name === dayName
          ? { ...d, entries: d.entries.filter((e) => e.exerciseId !== exerciseId) }
          : d,
      ),
    }
  })
}

/** Sposta un esercizio su o giù nel giorno (riordino); ai bordi non fa nulla. */
export function moveEntry(
  data: AppData,
  planId: string,
  dayName: string,
  exerciseId: string,
  direction: -1 | 1,
): AppData {
  return updatePlan(data, planId, (plan) => {
    const day = findDay(plan, dayName)
    const from = day.entries.findIndex((e) => e.exerciseId === exerciseId)
    const to = from + direction
    if (from === -1 || to < 0 || to >= day.entries.length) return plan
    const entries = [...day.entries]
    ;[entries[from], entries[to]] = [entries[to], entries[from]]
    return { ...plan, days: plan.days.map((d) => (d.name === dayName ? { ...d, entries } : d)) }
  })
}

const WEEKDAY_NAMES = new Set<string>(WEEKDAYS_IT.map((n) => n.toLowerCase()))

function matchesWeekday(day: WorkoutDay, isoDate: string): boolean {
  return day.name.trim().toLowerCase() === weekdayNameIt(isoDate).toLowerCase()
}

/** true se la scheda usa i giorni della settimana (e non giorni generici tipo «Giorno A»). */
export function planUsesWeekdays(plan: WorkoutPlan): boolean {
  return plan.days.some((d) => WEEKDAY_NAMES.has(d.name.trim().toLowerCase()))
}

/** Il giorno di scheda previsto per una data: match sul giorno della settimana. */
export function dayForDate(plan: WorkoutPlan, isoDate: string): WorkoutDay | null {
  return plan.days.find((d) => matchesWeekday(d, isoDate)) ?? null
}

export interface ScheduledDay {
  day: WorkoutDay
  date: string
}

/** Il prossimo allenamento previsto dopo una data (entro una settimana), per il giorno di riposo. */
export function nextScheduledDay(plan: WorkoutPlan, isoDate: string): ScheduledDay | null {
  for (let offset = 1; offset <= 7; offset++) {
    const date = addDaysIso(isoDate, offset)
    const day = plan.days.find((d) => matchesWeekday(d, date))
    if (day) return { day, date }
  }
  return null
}
