import type { ActivityRecord, AppData, Exercise, WorkoutPlan } from '../domain/types'

export const INVALID_JSON_ERROR = 'Il file non contiene JSON valido'
export const INVALID_FORMAT_ERROR = 'Formato di backup non riconosciuto'

/** Serializza tutti i dati dell'app per il backup su dispositivo. */
export function exportToJson(data: AppData): string {
  return JSON.stringify(data, null, 2)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isExercise(value: unknown): value is Exercise {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.description === 'string' &&
    typeof value.youtubeUrl === 'string' &&
    typeof value.muscleGroup === 'string' &&
    typeof value.votes === 'number' &&
    typeof value.createdAt === 'string'
  )
}

function isPlan(value: unknown): value is WorkoutPlan {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    Array.isArray(value.days) &&
    typeof value.votes === 'number'
  )
}

function isActivity(value: unknown): value is ActivityRecord {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.exerciseId === 'string' &&
    typeof value.date === 'string' &&
    Array.isArray(value.sets)
  )
}

/**
 * Ricostruisce i dati dell'app da un backup JSON.
 * Lancia un errore se il JSON non è valido o la struttura non è quella attesa.
 */
export function importFromJson(json: string): AppData {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error(INVALID_JSON_ERROR)
  }

  if (
    !isRecord(parsed) ||
    parsed.schemaVersion !== 1 ||
    !Array.isArray(parsed.exercises) ||
    !Array.isArray(parsed.plans) ||
    !Array.isArray(parsed.activity) ||
    !parsed.exercises.every(isExercise) ||
    !parsed.plans.every(isPlan) ||
    !parsed.activity.every(isActivity)
  ) {
    throw new Error(INVALID_FORMAT_ERROR)
  }

  return {
    schemaVersion: 1,
    exercises: parsed.exercises,
    plans: parsed.plans,
    activity: parsed.activity,
  }
}
