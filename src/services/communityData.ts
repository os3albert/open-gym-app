import {
  EMPTY_NAME_ERROR,
  INVALID_STATURE_RANGE_ERROR,
  INVALID_YOUTUBE_LINK_ERROR,
  MISSING_DIFFICULTY_ERROR,
  MISSING_MUSCLE_GROUP_ERROR,
} from '../domain/exercises'
import { EMPTY_DAY_NAME_ERROR, EMPTY_PLAN_NAME_ERROR } from '../domain/plans'
import {
  isDifficulty,
  isMuscleGroup,
  type Difficulty,
  type MuscleGroup,
  type StatureRange,
} from '../domain/types'
import { parseYouTubeVideoId } from './youtube'

export const DUPLICATE_EXERCISE_ERROR = 'DUPLICATE_EXERCISE'
export const UNKNOWN_EXERCISE_ERROR = 'UNKNOWN_EXERCISE'
export const TOO_LONG_ERROR = 'TOO_LONG'
export const DUPLICATE_PLAN_ERROR = 'DUPLICATE_PLAN'
export const UNKNOWN_PLAN_ERROR = 'UNKNOWN_PLAN'
export const INVALID_PLAN_ERROR = 'INVALID_PLAN'

/**
 * Limiti di lunghezza: il catalogo è un file pubblico del repo, e senza un tetto una
 * sola proposta potrebbe committarci megabyte di testo (abuso, non errore dell'utente).
 */
export const FIELD_LIMITS = {
  name: 80,
  description: 500,
  youtubeUrl: 200,
} as const

/**
 * Un esercizio del catalogo condiviso su GitHub (community/exercises.json).
 * Deliberatamente SENZA contatore di voti: i voti vivono in community/votes.json,
 * così due proposte concorrenti e due voti concorrenti non si sovrascrivono a vicenda.
 */
export interface CommunityExercise {
  id: string
  name: string
  description: string
  youtubeUrl: string
  /** Media alternativo (M16): la GIF delle voci del catalogo Gym visual, senza video. */
  gifUrl?: string
  /** Copyright del media («© Gym visual — …»), da mostrare accanto alla GIF: è un obbligo. */
  attribution?: string
  /** Testo libero nelle voci pubblicate prima di M14: l'app lo normalizza a runtime. */
  muscleGroup: string
  /** Opzionale nel TIPO, non nella validazione: le voci pubblicate prima di M13 non ce l'hanno. */
  difficulty?: Difficulty
  faceBlurConfirmed: boolean
  stature?: StatureRange
  createdAt: string
}

/** community/votes.json: per ogni esercizio, gli hash dei dispositivi che l'hanno votato. */
export type CommunityVotes = Record<string, string[]>

export interface ProposalInput {
  name: string
  description?: string
  youtubeUrl: string
  muscleGroup?: MuscleGroup
  difficulty?: Difficulty
  faceBlurConfirmed?: boolean
  stature?: StatureRange
}

function isValidStature(stature: StatureRange): boolean {
  return (
    Number.isFinite(stature.minCm) &&
    Number.isFinite(stature.maxCm) &&
    stature.minCm >= 100 &&
    stature.maxCm <= 250 &&
    stature.minCm <= stature.maxCm
  )
}

/**
 * Valida una proposta e la normalizza in un esercizio del catalogo.
 * Stessi messaggi di errore del dominio locale: l'utente vede sempre lo stesso testo.
 */
export function validateProposal(
  input: ProposalInput,
  catalog: CommunityExercise[],
  now: () => string = () => new Date().toISOString(),
  newId: () => string = () => crypto.randomUUID(),
): CommunityExercise {
  const name = input.name?.trim() ?? ''
  const description = input.description?.trim() ?? ''
  const muscleGroup = input.muscleGroup?.trim() ?? ''
  const youtubeUrl = input.youtubeUrl?.trim() ?? ''
  if (name === '') throw new Error(EMPTY_NAME_ERROR)
  if (!isDifficulty(input.difficulty)) throw new Error(MISSING_DIFFICULTY_ERROR)
  if (!isMuscleGroup(input.muscleGroup)) throw new Error(MISSING_MUSCLE_GROUP_ERROR)

  if (
    name.length > FIELD_LIMITS.name ||
    description.length > FIELD_LIMITS.description ||
    youtubeUrl.length > FIELD_LIMITS.youtubeUrl
  ) {
    throw new Error(TOO_LONG_ERROR)
  }

  const videoId = parseYouTubeVideoId(youtubeUrl)
  if (videoId === null) throw new Error(INVALID_YOUTUBE_LINK_ERROR)
  if (input.stature && !isValidStature(input.stature)) throw new Error(INVALID_STATURE_RANGE_ERROR)

  // Dedup sul video id, non sulla stringa del link (stessa regola della condivisione)
  if (catalog.some((e) => parseYouTubeVideoId(e.youtubeUrl) === videoId)) {
    throw new Error(DUPLICATE_EXERCISE_ERROR)
  }

  return {
    id: newId(),
    name,
    description,
    youtubeUrl,
    muscleGroup,
    difficulty: input.difficulty,
    faceBlurConfirmed: input.faceBlurConfirmed ?? false,
    ...(input.stature ? { stature: input.stature } : {}),
    createdAt: now(),
  }
}

/**
 * Applica un voto (o lo ritira): idempotente, un voto per votante.
 * `voterHash` NON arriva dal client: lo deriva il worker (vedi worker/src/index.ts),
 * altrimenti chiunque potrebbe gonfiare i voti inviando hash casuali.
 */
export function toggleCommunityVote(
  votes: CommunityVotes,
  exerciseId: string,
  voterHash: string,
  action: 'add' | 'remove',
  catalog: CommunityExercise[],
): CommunityVotes {
  if (!catalog.some((e) => e.id === exerciseId)) throw new Error(UNKNOWN_EXERCISE_ERROR)
  return applyVote(votes, exerciseId, voterHash, action)
}

function applyVote(
  votes: CommunityVotes,
  id: string,
  voterHash: string,
  action: 'add' | 'remove',
): CommunityVotes {
  const current = votes[id] ?? []
  const next =
    action === 'add'
      ? current.includes(voterHash)
        ? current
        : [...current, voterHash]
      : current.filter((hash) => hash !== voterHash)

  return { ...votes, [id]: next }
}

/** Conteggio dei voti per esercizio, dalla lista di hash. */
export function voteCount(votes: CommunityVotes, exerciseId: string): number {
  return votes[exerciseId]?.length ?? 0
}

/** Solo i conteggi: è quanto serve all'app, che gli hash dei votanti non li conosce. */
export function voteCounts(votes: CommunityVotes): Record<string, number> {
  return Object.fromEntries(Object.entries(votes).map(([id, hashes]) => [id, hashes.length]))
}

/**
 * Limiti delle schede proposte (community/plans.json): come per gli esercizi, il file è
 * pubblico nel repo e una proposta non deve potervi scrivere megabyte. La `gifUrl` è più
 * lunga di un link YouTube perché punta al dataset a commit pinnato su raw.githubusercontent.
 */
export const PLAN_LIMITS = {
  name: 80,
  dayName: 40,
  days: 7,
  entriesPerDay: 15,
  gifUrl: 300,
} as const

/**
 * Una scheda del catalogo condiviso (community/plans.json): gli esercizi sono INCORPORATI
 * nella stessa forma portabile della condivisione (`SharedPlan`, senza id né voti locali),
 * così l'import nell'app passa dallo stesso motore (`applySharedPayload`). Come per gli
 * esercizi, niente contatore di voti qui: i voti vivono in community/plan-votes.json.
 */
export interface CommunityPlanExercise {
  name: string
  description: string
  youtubeUrl: string
  gifUrl?: string
  attribution?: string
  muscleGroup: string
  difficulty?: Difficulty
  faceBlurConfirmed: boolean
  stature?: StatureRange
}

export interface CommunityPlanEntry {
  exercise: CommunityPlanExercise
  sets: number
  reps: number
}

export interface CommunityPlanDay {
  name: string
  entries: CommunityPlanEntry[]
}

export interface CommunityPlan {
  id: string
  name: string
  days: CommunityPlanDay[]
  createdAt: string
}

export interface PlanProposalInput {
  name: string
  days: CommunityPlanDay[]
}

function isPositiveInt(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 1
}

/** Valida un esercizio incorporato in una scheda proposta e lo normalizza. */
function validatePlanExercise(exercise: CommunityPlanExercise): CommunityPlanExercise {
  const name = exercise?.name?.trim() ?? ''
  const description = exercise?.description?.trim() ?? ''
  const youtubeUrl = exercise?.youtubeUrl?.trim() ?? ''
  const gifUrl = exercise?.gifUrl?.trim() ?? ''
  const muscleGroup = exercise?.muscleGroup?.trim() ?? ''
  if (name === '') throw new Error(EMPTY_NAME_ERROR)
  if (muscleGroup === '') throw new Error(MISSING_MUSCLE_GROUP_ERROR)
  if (exercise.difficulty !== undefined && !isDifficulty(exercise.difficulty)) {
    throw new Error(MISSING_DIFFICULTY_ERROR)
  }
  if (
    name.length > FIELD_LIMITS.name ||
    description.length > FIELD_LIMITS.description ||
    youtubeUrl.length > FIELD_LIMITS.youtubeUrl ||
    gifUrl.length > PLAN_LIMITS.gifUrl
  ) {
    throw new Error(TOO_LONG_ERROR)
  }
  // Almeno un media, come nella condivisione (M16): video valido, o GIF senza video.
  // Un link scritto ma non valido resta rifiutato anche con la GIF.
  const videoId = parseYouTubeVideoId(youtubeUrl)
  if (videoId === null && !(youtubeUrl === '' && gifUrl !== '')) {
    throw new Error(INVALID_YOUTUBE_LINK_ERROR)
  }
  if (exercise.stature && !isValidStature(exercise.stature)) {
    throw new Error(INVALID_STATURE_RANGE_ERROR)
  }
  return {
    name,
    description,
    youtubeUrl,
    ...(gifUrl !== '' ? { gifUrl } : {}),
    ...(exercise.attribution?.trim() ? { attribution: exercise.attribution.trim() } : {}),
    muscleGroup,
    ...(exercise.difficulty !== undefined ? { difficulty: exercise.difficulty } : {}),
    faceBlurConfirmed: exercise.faceBlurConfirmed === true,
    ...(exercise.stature ? { stature: exercise.stature } : {}),
  }
}

/**
 * Valida una scheda proposta e la normalizza in una voce del catalogo.
 * Come per gli esercizi: stessi CODICI d'errore del dominio locale dove esistono,
 * dedup sul nome (senza maiuscole) perché una scheda non ha un media su cui dedupare.
 */
export function validatePlanProposal(
  input: PlanProposalInput,
  catalog: CommunityPlan[],
  now: () => string = () => new Date().toISOString(),
  newId: () => string = () => crypto.randomUUID(),
): CommunityPlan {
  const name = input?.name?.trim() ?? ''
  if (name === '') throw new Error(EMPTY_PLAN_NAME_ERROR)
  if (name.length > PLAN_LIMITS.name) throw new Error(TOO_LONG_ERROR)

  if (!Array.isArray(input.days) || input.days.length < 1 || input.days.length > PLAN_LIMITS.days) {
    throw new Error(INVALID_PLAN_ERROR)
  }

  const days = input.days.map((day) => {
    const dayName = day?.name?.trim() ?? ''
    if (dayName === '') throw new Error(EMPTY_DAY_NAME_ERROR)
    if (dayName.length > PLAN_LIMITS.dayName) throw new Error(TOO_LONG_ERROR)
    if (!Array.isArray(day.entries) || day.entries.length > PLAN_LIMITS.entriesPerDay) {
      throw new Error(INVALID_PLAN_ERROR)
    }
    const entries = day.entries.map((entry) => {
      if (!isPositiveInt(entry?.sets) || !isPositiveInt(entry?.reps)) {
        throw new Error(INVALID_PLAN_ERROR)
      }
      return { exercise: validatePlanExercise(entry.exercise), sets: entry.sets, reps: entry.reps }
    })
    return { name: dayName, entries }
  })
  // Una scheda senza nemmeno un esercizio non è una proposta: non c'è niente da provare
  if (days.every((day) => day.entries.length === 0)) throw new Error(INVALID_PLAN_ERROR)

  if (catalog.some((p) => p.name.trim().toLowerCase() === name.toLowerCase())) {
    throw new Error(DUPLICATE_PLAN_ERROR)
  }

  return { id: newId(), name, days, createdAt: now() }
}

/** Come `toggleCommunityVote`, ma sulle schede proposte (community/plan-votes.json). */
export function togglePlanVote(
  votes: CommunityVotes,
  planId: string,
  voterHash: string,
  action: 'add' | 'remove',
  plans: CommunityPlan[],
): CommunityVotes {
  if (!plans.some((p) => p.id === planId)) throw new Error(UNKNOWN_PLAN_ERROR)
  return applyVote(votes, planId, voterHash, action)
}
