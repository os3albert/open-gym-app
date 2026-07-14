import type { ActivityRecord, AppData, Exercise, UserProfile, WorkoutPlan } from '../domain/types'
import { CURRENT_SCHEMA_VERSION } from '../domain/types'
import { generateId } from '../utils/id'
import { migrateToCurrentSchema } from './migrations'
import { parseYouTubeVideoId } from './youtube'

export const INVALID_JSON_ERROR = 'INVALID_JSON'
export const INVALID_FORMAT_ERROR = 'INVALID_FORMAT'

/** Serializza tutti i dati dell'app (usato anche da storage.ts per localStorage). */
export function exportToJson(data: AppData): string {
  return JSON.stringify(data, null, 2)
}

/** Il file di backup scaricato: i dati più la data di export (ignorata al reimport). */
export function exportBackupJson(data: AppData, now: Date = new Date()): string {
  return JSON.stringify({ ...data, exportedAt: now.toISOString() }, null, 2)
}

/** Nome del file di backup con la data locale del giorno (issue #23). */
export function backupFileName(dateIso: string): string {
  return `open-gym-backup-${dateIso}.json`
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

function isPlanEntry(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.exerciseId === 'string' &&
    typeof value.sets === 'number' &&
    typeof value.reps === 'number'
  )
}

function isWorkoutDay(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.name === 'string' &&
    Array.isArray(value.entries) &&
    value.entries.every(isPlanEntry)
  )
}

function isPlan(value: unknown): value is WorkoutPlan {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    Array.isArray(value.days) &&
    value.days.every(isWorkoutDay) &&
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
    !(migrated.activePlanId === null || typeof migrated.activePlanId === 'string') ||
    !isProfile(migrated.profile)
  ) {
    throw new Error(INVALID_FORMAT_ERROR)
  }

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exercises: migrated.exercises,
    plans: migrated.plans,
    activePlanId: migrated.activePlanId as string | null,
    activity: migrated.activity,
    profile: { statureCm: (migrated.profile as UserProfile).statureCm },
    votedExerciseIds: migrated.votedExerciseIds,
  }
}

/**
 * Unisce un backup ai dati presenti senza creare duplicati (issue #24), con le stesse
 * regole dell'import delle schede condivise: esercizi deduplicati sul video YouTube,
 * schede sul nome, sessioni su esercizio+giorno. In caso di conflitto vincono i dati locali.
 */
export function mergeData(local: AppData, backup: AppData): AppData {
  const usedIds = new Set([
    ...local.exercises.map((e) => e.id),
    ...local.plans.map((p) => p.id),
    ...local.activity.map((a) => a.id),
  ])
  const freshId = (candidate: string): string => {
    const id = usedIds.has(candidate) ? generateId() : candidate
    usedIds.add(id)
    return id
  }

  // Esercizi: stesso video YouTube = stesso esercizio, si riusa quello locale
  const byVideoId = new Map(
    local.exercises.flatMap((e) => {
      const videoId = parseYouTubeVideoId(e.youtubeUrl)
      return videoId ? [[videoId, e.id] as const] : []
    }),
  )
  const exerciseIdMap = new Map<string, string>()
  const addedExerciseIds = new Set<string>()
  const exercises = [...local.exercises]
  for (const incoming of backup.exercises) {
    const videoId = parseYouTubeVideoId(incoming.youtubeUrl)
    const existingId = videoId ? byVideoId.get(videoId) : undefined
    if (existingId) {
      exerciseIdMap.set(incoming.id, existingId)
      continue
    }
    const id = freshId(incoming.id)
    exerciseIdMap.set(incoming.id, id)
    addedExerciseIds.add(id)
    exercises.push({ ...incoming, id })
    if (videoId) byVideoId.set(videoId, id)
  }

  // Schede: una scheda con lo stesso nome esiste già → si tiene quella locale
  const localPlanNames = new Set(local.plans.map((p) => p.name.trim().toLowerCase()))
  const plans = [...local.plans]
  for (const incoming of backup.plans) {
    if (localPlanNames.has(incoming.name.trim().toLowerCase())) continue
    plans.push({
      ...incoming,
      id: freshId(incoming.id),
      days: incoming.days.map((day) => ({
        ...day,
        // Un esercizio del backup può essere «collassato» su uno locale: mai entry doppie
        entries: day.entries.flatMap((entry, index, all) => {
          const exerciseId = exerciseIdMap.get(entry.exerciseId)
          if (!exerciseId) return []
          const firstIndex = all.findIndex((e) => exerciseIdMap.get(e.exerciseId) === exerciseId)
          return firstIndex === index ? [{ ...entry, exerciseId }] : []
        }),
      })),
    })
  }

  // Sessioni: per (esercizio, giorno) già registrati localmente vince il dato locale
  const localSessions = new Set(local.activity.map((a) => `${a.exerciseId}|${a.date}`))
  const activity = [...local.activity]
  for (const incoming of backup.activity) {
    const exerciseId = exerciseIdMap.get(incoming.exerciseId)
    if (!exerciseId || localSessions.has(`${exerciseId}|${incoming.date}`)) continue
    localSessions.add(`${exerciseId}|${incoming.date}`)
    activity.push({ ...incoming, id: freshId(incoming.id), exerciseId })
  }

  // Il voto del backup si conserva solo per gli esercizi davvero aggiunti: per quelli
  // collassati su un esercizio locale il contatore voti del backup non è stato sommato,
  // e importarne il flag renderebbe incoerente il toggle (rimuoverebbe un voto mai contato).
  const mergedExerciseIds = new Set(exercises.map((e) => e.id))
  const votedExerciseIds = [
    ...new Set([
      ...local.votedExerciseIds,
      ...backup.votedExerciseIds
        .map((id) => exerciseIdMap.get(id))
        .filter((id): id is string => id !== undefined && addedExerciseIds.has(id)),
    ]),
  ].filter((id) => mergedExerciseIds.has(id))

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exercises,
    plans,
    activePlanId: local.activePlanId,
    activity,
    profile: { statureCm: local.profile.statureCm ?? backup.profile.statureCm },
    votedExerciseIds,
  }
}
