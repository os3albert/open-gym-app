import { isValidYouTubeUrl } from '../services/youtube'
import { generateId } from '../utils/id'
import type { AppData, Exercise, StatureRange } from './types'

export const INVALID_YOUTUBE_LINK_ERROR = 'Inserisci un link YouTube valido'
export const EMPTY_NAME_ERROR = "Il nome dell'esercizio è obbligatorio"
export const FACE_BLUR_REQUIRED_ERROR = 'Conferma che il volto nel video è offuscato'
export const INVALID_STATURE_RANGE_ERROR = 'La fascia di statura non è valida (100–250 cm)'

export const MIN_STATURE_CM = 100
export const MAX_STATURE_CM = 250

export interface NewExercise {
  name: string
  description: string
  youtubeUrl: string
  muscleGroup: string
  stature?: StatureRange
  faceBlurConfirmed: boolean
}

function isValidStatureRange(range: StatureRange): boolean {
  return (
    range.minCm >= MIN_STATURE_CM && range.maxCm <= MAX_STATURE_CM && range.minCm <= range.maxCm
  )
}

function validate(input: NewExercise): void {
  if (!input.name.trim()) throw new Error(EMPTY_NAME_ERROR)
  if (!isValidYouTubeUrl(input.youtubeUrl)) throw new Error(INVALID_YOUTUBE_LINK_ERROR)
  if (!input.faceBlurConfirmed) throw new Error(FACE_BLUR_REQUIRED_ERROR)
  if (input.stature && !isValidStatureRange(input.stature)) {
    throw new Error(INVALID_STATURE_RANGE_ERROR)
  }
}

/** Valida i dati e crea un nuovo esercizio con 0 voti. Lancia un errore se non validi. */
export function createExercise(input: NewExercise, now: Date = new Date()): Exercise {
  validate(input)
  return {
    id: generateId(),
    name: input.name.trim(),
    description: input.description.trim(),
    youtubeUrl: input.youtubeUrl.trim(),
    muscleGroup: input.muscleGroup.trim(),
    ...(input.stature ? { stature: input.stature } : {}),
    faceBlurConfirmed: true,
    votes: 0,
    createdAt: now.toISOString(),
  }
}

export function addExercise(data: AppData, input: NewExercise): AppData {
  return { ...data, exercises: [...data.exercises, createExercise(input)] }
}

/** Aggiorna un esercizio esistente rivalidando i campi; voti, id e data restano invariati. */
export function updateExercise(data: AppData, exerciseId: string, input: NewExercise): AppData {
  validate(input)
  return {
    ...data,
    exercises: data.exercises.map((e) => {
      if (e.id !== exerciseId) return e
      // Niente chiavi undefined: romperebbero il round-trip del backup JSON
      const { stature: _removed, ...rest } = e
      return {
        ...rest,
        name: input.name.trim(),
        description: input.description.trim(),
        youtubeUrl: input.youtubeUrl.trim(),
        muscleGroup: input.muscleGroup.trim(),
        ...(input.stature ? { stature: input.stature } : {}),
      }
    }),
  }
}

/** Elimina l'esercizio, il relativo voto del dispositivo e le occorrenze nelle schede. */
export function deleteExercise(data: AppData, exerciseId: string): AppData {
  return {
    ...data,
    exercises: data.exercises.filter((e) => e.id !== exerciseId),
    votedExerciseIds: data.votedExerciseIds.filter((id) => id !== exerciseId),
    plans: data.plans.map((plan) => ({
      ...plan,
      days: plan.days.map((day) => ({
        ...day,
        entries: day.entries.filter((entry) => entry.exerciseId !== exerciseId),
      })),
    })),
  }
}

export function hasVoted(data: AppData, exerciseId: string): boolean {
  return data.votedExerciseIds.includes(exerciseId)
}

/**
 * Voto stile Reddit, un voto per dispositivo: se non ho ancora votato aggiunge il voto,
 * se ho già votato lo rimuove (toggle).
 */
export function toggleVote(data: AppData, exerciseId: string): AppData {
  if (!data.exercises.some((e) => e.id === exerciseId)) return data
  const alreadyVoted = hasVoted(data, exerciseId)
  const delta = alreadyVoted ? -1 : 1
  return {
    ...data,
    exercises: data.exercises.map((e) =>
      e.id === exerciseId ? { ...e, votes: e.votes + delta } : e,
    ),
    votedExerciseIds: alreadyVoted
      ? data.votedExerciseIds.filter((id) => id !== exerciseId)
      : [...data.votedExerciseIds, exerciseId],
  }
}

/** Classifica stile Reddit: più voti in alto; a parità, il più recente prima. */
export function rankExercises(exercises: Exercise[]): Exercise[] {
  return [...exercises].sort((a, b) => b.votes - a.votes || b.createdAt.localeCompare(a.createdAt))
}
