import type { ActivityRecord, AppData, Exercise, UserProfile, WorkoutPlan } from '../domain/types'
import { CURRENT_SCHEMA_VERSION } from '../domain/types'
import { migrateToCurrentSchema } from './migrations'

export const INVALID_JSON_ERROR = 'Il file non contiene JSON valido'
export const INVALID_FORMAT_ERROR = 'Formato di backup non riconosciuto'

/** Serializza tutti i dati dell'app per il backup su dispositivo. */
export function exportToJson(data: AppData): string {
  return JSON.stringify(data, null, 2)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStatureRange(value: unknown): boolean {
  return isRecord(value) && typeof value.minCm === 'number' && typeof value.maxCm === 'number'
}

function isExercise(value: unknown): value is Exercise {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.description === 'string' &&
    typeof value.youtubeUrl === 'string' &&
    typeof value.muscleGroup === 'string' &&
    typeof value.faceBlurConfirmed === 'boolean' &&
    (value.stature === undefined || isStatureRange(value.stature)) &&
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

function isProfile(value: unknown): value is UserProfile {
  return isRecord(value) && (value.statureCm === null || typeof value.statureCm === 'number')
}

/**
 * Ricostruisce i dati dell'app da un backup JSON, migrando gli schemi precedenti.
 * Lancia un errore se il JSON non è valido o la struttura non è quella attesa.
 */
export function importFromJson(json: string): AppData {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error(INVALID_JSON_ERROR)
  }
  if (!isRecord(parsed)) throw new Error(INVALID_FORMAT_ERROR)

  const migrated = migrateToCurrentSchema(parsed)

  if (
    migrated.schemaVersion !== CURRENT_SCHEMA_VERSION ||
    !Array.isArray(migrated.exercises) ||
    !Array.isArray(migrated.plans) ||
    !Array.isArray(migrated.activity) ||
    !Array.isArray(migrated.votedExerciseIds) ||
    !migrated.exercises.every(isExercise) ||
    !migrated.plans.every(isPlan) ||
    !migrated.activity.every(isActivity) ||
    !migrated.votedExerciseIds.every((id) => typeof id === 'string') ||
    !isProfile(migrated.profile)
  ) {
    throw new Error(INVALID_FORMAT_ERROR)
  }

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exercises: migrated.exercises,
    plans: migrated.plans,
    activity: migrated.activity,
    profile: { statureCm: (migrated.profile as UserProfile).statureCm },
    votedExerciseIds: migrated.votedExerciseIds,
  }
}
