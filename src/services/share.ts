import LZString from 'lz-string'
import { PLAN_NOT_FOUND_ERROR } from '../domain/plans'
import { normalizeMuscleGroup } from '../domain/muscleGroups'
import { isDifficulty } from '../domain/types'
import type {
  Difficulty,
  AppData,
  Exercise,
  PlanEntry,
  StatureRange,
  WorkoutPlan,
} from '../domain/types'
import { generateId } from '../utils/id'
import { isValidYouTubeUrl, parseYouTubeVideoId } from './youtube'

export const SHARE_VERSION = 1
export const INVALID_SHARE_CODE_ERROR = 'INVALID_SHARE_CODE'
/** Prefisso del fragment per aprire una condivisione da link (#dati=…). */
export const SHARE_HASH_PREFIX = '#dati='

/** Esercizio in forma portabile: senza id, voti e data, che sono locali al dispositivo. */
export interface SharedExercise {
  name: string
  description: string
  youtubeUrl: string
  muscleGroup: string
  /** Assente nei codici generati prima di M13: si legge come «media», non si rifiuta il codice. */
  difficulty?: Difficulty
  stature?: StatureRange
  faceBlurConfirmed: boolean
}

export interface SharedPlanEntry {
  exercise: SharedExercise
  sets: number
  reps: number
}

export interface SharedPlanDay {
  name: string
  entries: SharedPlanEntry[]
}

export interface SharedPlan {
  name: string
  days: SharedPlanDay[]
}

/** Il pacchetto che viaggia nel codice di condivisione (JSON compresso, URL-safe). */
export type SharePayload =
  | { version: typeof SHARE_VERSION; kind: 'exercise'; exercise: SharedExercise }
  | { version: typeof SHARE_VERSION; kind: 'plan'; plan: SharedPlan }

function toSharedExercise(exercise: Exercise): SharedExercise {
  return {
    name: exercise.name,
    description: exercise.description,
    youtubeUrl: exercise.youtubeUrl,
    muscleGroup: exercise.muscleGroup,
    difficulty: exercise.difficulty,
    // Niente chiavi undefined: il payload fa un round-trip JSON
    ...(exercise.stature ? { stature: exercise.stature } : {}),
    faceBlurConfirmed: exercise.faceBlurConfirmed,
  }
}

function encode(payload: SharePayload): string {
  return LZString.compressToEncodedURIComponent(JSON.stringify(payload))
}

/** Genera il codice di condivisione di un esercizio (issue #20). */
export function encodeExerciseShare(exercise: Exercise): string {
  return encode({ version: SHARE_VERSION, kind: 'exercise', exercise: toSharedExercise(exercise) })
}

/** Genera il codice di condivisione di una scheda completa, con gli esercizi incorporati. */
export function encodePlanShare(data: AppData, planId: string): string {
  const plan = data.plans.find((p) => p.id === planId)
  if (!plan) throw new Error(PLAN_NOT_FOUND_ERROR)
  const days: SharedPlanDay[] = plan.days.map((day) => ({
    name: day.name,
    entries: day.entries.flatMap((entry) => {
      const exercise = data.exercises.find((e) => e.id === entry.exerciseId)
      // Un riferimento pendente non deve invalidare il pacchetto: si condivide ciò che esiste
      if (!exercise) return []
      return [{ exercise: toSharedExercise(exercise), sets: entry.sets, reps: entry.reps }]
    }),
  }))
  return encode({ version: SHARE_VERSION, kind: 'plan', plan: { name: plan.name, days } })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isSharedExercise(value: unknown): value is SharedExercise {
  return (
    isRecord(value) &&
    typeof value.name === 'string' &&
    value.name.trim() !== '' &&
    typeof value.description === 'string' &&
    typeof value.youtubeUrl === 'string' &&
    isValidYouTubeUrl(value.youtubeUrl) &&
    typeof value.muscleGroup === 'string' &&
    // I codici in circolazione non hanno la difficoltà: si accettano lo stesso
    (value.difficulty === undefined || isDifficulty(value.difficulty)) &&
    typeof value.faceBlurConfirmed === 'boolean' &&
    (value.stature === undefined ||
      (isRecord(value.stature) &&
        typeof value.stature.minCm === 'number' &&
        typeof value.stature.maxCm === 'number'))
  )
}

function isSharedPlanEntry(value: unknown): value is SharedPlanEntry {
  return (
    isRecord(value) &&
    isSharedExercise(value.exercise) &&
    Number.isInteger(value.sets) &&
    (value.sets as number) >= 1 &&
    Number.isInteger(value.reps) &&
    (value.reps as number) >= 1
  )
}

function isSharedPlan(value: unknown): value is SharedPlan {
  return (
    isRecord(value) &&
    typeof value.name === 'string' &&
    value.name.trim() !== '' &&
    Array.isArray(value.days) &&
    value.days.every(
      (day) =>
        isRecord(day) &&
        typeof day.name === 'string' &&
        day.name.trim() !== '' &&
        Array.isArray(day.entries) &&
        day.entries.every(isSharedPlanEntry),
    )
  )
}

function isSharePayload(value: unknown): value is SharePayload {
  if (!isRecord(value) || value.version !== SHARE_VERSION) return false
  if (value.kind === 'exercise') return isSharedExercise(value.exercise)
  if (value.kind === 'plan') return isSharedPlan(value.plan)
  return false
}

/** Decodifica e valida un codice di condivisione. Lancia INVALID_SHARE_CODE_ERROR se non valido. */
export function decodeShare(code: string): SharePayload {
  const json = LZString.decompressFromEncodedURIComponent(code.trim())
  if (!json) throw new Error(INVALID_SHARE_CODE_ERROR)
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error(INVALID_SHARE_CODE_ERROR)
  }
  if (!isSharePayload(parsed)) throw new Error(INVALID_SHARE_CODE_ERROR)
  return parsed
}

/** Estrae il codice di condivisione dal fragment di un URL (#dati=…), se presente. */
export function shareCodeFromHash(hash: string): string | null {
  return hash.startsWith(SHARE_HASH_PREFIX) ? hash.slice(SHARE_HASH_PREFIX.length) : null
}

function findByVideoId(data: AppData, youtubeUrl: string): Exercise | undefined {
  const videoId = parseYouTubeVideoId(youtubeUrl)
  return data.exercises.find((e) => parseYouTubeVideoId(e.youtubeUrl) === videoId)
}

/**
 * Aggiunge l'esercizio condiviso, o riusa quello già presente con lo stesso video YouTube
 * (dedup dell'issue #21): mai duplicare un esercizio che l'utente ha già.
 */
function mergeSharedExercise(
  data: AppData,
  shared: SharedExercise,
): { data: AppData; exerciseId: string } {
  const existing = findByVideoId(data, shared.youtubeUrl)
  if (existing) return { data, exerciseId: existing.id }
  const exercise: Exercise = {
    id: generateId(),
    name: shared.name.trim(),
    description: shared.description.trim(),
    youtubeUrl: shared.youtubeUrl.trim(),
    // I codici generati prima di M14 portano il gruppo come testo libero: si normalizza
    // invece di rifiutare un codice che qualcuno si è già scambiato.
    muscleGroup: normalizeMuscleGroup(shared.muscleGroup),
    difficulty: shared.difficulty ?? 'medium',
    ...(shared.stature ? { stature: shared.stature } : {}),
    faceBlurConfirmed: shared.faceBlurConfirmed,
    votes: 0,
    createdAt: new Date().toISOString(),
  }
  return { data: { ...data, exercises: [...data.exercises, exercise] }, exerciseId: exercise.id }
}

export interface ShareImportResult {
  data: AppData
  /** Presente se il codice era una scheda: l'id per «Prova questa scheda». */
  planId?: string
}

/** Applica un pacchetto condiviso ai dati locali: esercizi con dedup, scheda con id nuovi. */
export function applySharedPayload(data: AppData, payload: SharePayload): ShareImportResult {
  if (payload.kind === 'exercise') {
    return { data: mergeSharedExercise(data, payload.exercise).data }
  }
  let next = data
  const days = payload.plan.days.map((day) => {
    const entries: PlanEntry[] = []
    for (const shared of day.entries) {
      const merged = mergeSharedExercise(next, shared.exercise)
      next = merged.data
      if (!entries.some((e) => e.exerciseId === merged.exerciseId)) {
        entries.push({ exerciseId: merged.exerciseId, sets: shared.sets, reps: shared.reps })
      }
    }
    return { name: day.name, entries }
  })
  const plan: WorkoutPlan = { id: generateId(), name: payload.plan.name, days, votes: 0 }
  return { data: { ...next, plans: [...next.plans, plan] }, planId: plan.id }
}
