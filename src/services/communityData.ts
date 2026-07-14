import {
  EMPTY_NAME_ERROR,
  INVALID_STATURE_RANGE_ERROR,
  INVALID_YOUTUBE_LINK_ERROR,
  MISSING_DIFFICULTY_ERROR,
} from '../domain/exercises'
import { isDifficulty, type Difficulty, type StatureRange } from '../domain/types'
import { parseYouTubeVideoId } from './youtube'

export const DUPLICATE_EXERCISE_ERROR = 'DUPLICATE_EXERCISE'
export const UNKNOWN_EXERCISE_ERROR = 'UNKNOWN_EXERCISE'
export const TOO_LONG_ERROR = 'TOO_LONG'

/**
 * Limiti di lunghezza: il catalogo è un file pubblico del repo, e senza un tetto una
 * sola proposta potrebbe committarci megabyte di testo (abuso, non errore dell'utente).
 */
export const FIELD_LIMITS = {
  name: 80,
  muscleGroup: 40,
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
  muscleGroup?: string
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

  if (
    name.length > FIELD_LIMITS.name ||
    description.length > FIELD_LIMITS.description ||
    muscleGroup.length > FIELD_LIMITS.muscleGroup ||
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

  const current = votes[exerciseId] ?? []
  const next =
    action === 'add'
      ? current.includes(voterHash)
        ? current
        : [...current, voterHash]
      : current.filter((hash) => hash !== voterHash)

  return { ...votes, [exerciseId]: next }
}

/** Conteggio dei voti per esercizio, dalla lista di hash. */
export function voteCount(votes: CommunityVotes, exerciseId: string): number {
  return votes[exerciseId]?.length ?? 0
}

/** Solo i conteggi: è quanto serve all'app, che gli hash dei votanti non li conosce. */
export function voteCounts(votes: CommunityVotes): Record<string, number> {
  return Object.fromEntries(Object.entries(votes).map(([id, hashes]) => [id, hashes.length]))
}
