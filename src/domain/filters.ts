import { rankExercises } from './exercises'
import type { AppData, Exercise } from './types'

export type SortOrder = 'votes' | 'recent'

export interface ExerciseFilters {
  /** Mostra solo gli esercizi adatti alla statura del profilo ("Adatti a me"). */
  suitableOnly: boolean
  /** Gruppo muscolare esatto, null = tutti. */
  muscleGroup: string | null
  sort: SortOrder
}

export const defaultFilters: ExerciseFilters = {
  suitableOnly: false,
  muscleGroup: null,
  sort: 'votes',
}

/** Senza fascia di statura l'esercizio è considerato adatto a chiunque. */
export function isSuitableForStature(exercise: Exercise, statureCm: number): boolean {
  if (!exercise.stature) return true
  return statureCm >= exercise.stature.minCm && statureCm <= exercise.stature.maxCm
}

/** Il filtro "Adatti a me" ha senso solo con una statura nel profilo: la UI la chiede prima. */
export function suitabilityRequiresStature(filters: ExerciseFilters, data: AppData): boolean {
  return filters.suitableOnly && data.profile.statureCm === null
}

export function muscleGroups(exercises: Exercise[]): string[] {
  return [...new Set(exercises.map((e) => e.muscleGroup).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  )
}

/** Applica filtri e ordinamento; il filtro statura è ignorato finché il profilo non ha una statura. */
export function applyFilters(data: AppData, filters: ExerciseFilters): Exercise[] {
  let result = data.exercises
  if (filters.suitableOnly && data.profile.statureCm !== null) {
    const stature = data.profile.statureCm
    result = result.filter((e) => isSuitableForStature(e, stature))
  }
  if (filters.muscleGroup !== null) {
    result = result.filter((e) => e.muscleGroup === filters.muscleGroup)
  }
  return filters.sort === 'votes'
    ? rankExercises(result)
    : [...result].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
