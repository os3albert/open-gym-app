import { isValidYouTubeUrl } from '../services/youtube'
import { generateId } from '../utils/id'
import type { AppData, Exercise, StatureRange } from './types'

export const INVALID_YOUTUBE_LINK_ERROR = 'Il link deve essere un video YouTube valido'
export const EMPTY_NAME_ERROR = "Il nome dell'esercizio è obbligatorio"

export interface NewExercise {
  name: string
  description: string
  youtubeUrl: string
  muscleGroup: string
  stature?: StatureRange
}

/** Valida i dati e crea un nuovo esercizio con 0 voti. Lancia un errore se non validi. */
export function createExercise(input: NewExercise, now: Date = new Date()): Exercise {
  if (!input.name.trim()) throw new Error(EMPTY_NAME_ERROR)
  if (!isValidYouTubeUrl(input.youtubeUrl)) throw new Error(INVALID_YOUTUBE_LINK_ERROR)
  return {
    id: generateId(),
    name: input.name.trim(),
    description: input.description.trim(),
    youtubeUrl: input.youtubeUrl.trim(),
    muscleGroup: input.muscleGroup.trim(),
    ...(input.stature ? { stature: input.stature } : {}),
    votes: 0,
    createdAt: now.toISOString(),
  }
}

export function addExercise(data: AppData, input: NewExercise): AppData {
  return { ...data, exercises: [...data.exercises, createExercise(input)] }
}

export function upvoteExercise(data: AppData, exerciseId: string): AppData {
  return {
    ...data,
    exercises: data.exercises.map((e) => (e.id === exerciseId ? { ...e, votes: e.votes + 1 } : e)),
  }
}

/** Classifica stile Reddit: più voti in alto; a parità, il più recente prima. */
export function rankExercises(exercises: Exercise[]): Exercise[] {
  return [...exercises].sort((a, b) => b.votes - a.votes || b.createdAt.localeCompare(a.createdAt))
}
