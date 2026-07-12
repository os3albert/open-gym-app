import {
  EMPTY_NAME_ERROR,
  FACE_BLUR_REQUIRED_ERROR,
  INVALID_STATURE_RANGE_ERROR,
  INVALID_YOUTUBE_LINK_ERROR,
} from '../domain/exercises'
import type { StatureRange } from '../domain/types'
import { parseYouTubeVideoId } from './youtube'

export const DUPLICATE_EXERCISE_ERROR = 'Questo video è già nel catalogo della community'
export const UNKNOWN_EXERCISE_ERROR = 'Esercizio non presente nel catalogo della community'

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
  faceBlurConfirmed: boolean
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
  if (name === '') throw new Error(EMPTY_NAME_ERROR)
  if (!input.faceBlurConfirmed) throw new Error(FACE_BLUR_REQUIRED_ERROR)

  const videoId = parseYouTubeVideoId(input.youtubeUrl ?? '')
  if (videoId === null) throw new Error(INVALID_YOUTUBE_LINK_ERROR)
  if (input.stature && !isValidStature(input.stature)) throw new Error(INVALID_STATURE_RANGE_ERROR)

  // Dedup sul video id, non sulla stringa del link (stessa regola della condivisione)
  if (catalog.some((e) => parseYouTubeVideoId(e.youtubeUrl) === videoId)) {
    throw new Error(DUPLICATE_EXERCISE_ERROR)
  }

  return {
    id: newId(),
    name,
    description: input.description?.trim() ?? '',
    youtubeUrl: input.youtubeUrl.trim(),
    muscleGroup: input.muscleGroup?.trim() ?? '',
    faceBlurConfirmed: true,
    ...(input.stature ? { stature: input.stature } : {}),
    createdAt: now(),
  }
}

/** Applica un voto (o lo ritira): idempotente, un voto per dispositivo. */
export function toggleCommunityVote(
  votes: CommunityVotes,
  exerciseId: string,
  deviceHash: string,
  action: 'add' | 'remove',
  catalog: CommunityExercise[],
): CommunityVotes {
  if (!catalog.some((e) => e.id === exerciseId)) throw new Error(UNKNOWN_EXERCISE_ERROR)

  const current = votes[exerciseId] ?? []
  const next =
    action === 'add'
      ? current.includes(deviceHash)
        ? current
        : [...current, deviceHash]
      : current.filter((hash) => hash !== deviceHash)

  return { ...votes, [exerciseId]: next }
}

/** Conteggio dei voti per esercizio, dalla lista di hash. */
export function voteCount(votes: CommunityVotes, exerciseId: string): number {
  return votes[exerciseId]?.length ?? 0
}
