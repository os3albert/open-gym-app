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

/**
 * Applica filtri e ordinamento a una lista qualunque di esercizi (locali, della community o
 * entrambi); il filtro statura è ignorato finché il profilo non ha una statura.
 */
export function applyFiltersTo<T extends Exercise>(
  exercises: T[],
  filters: ExerciseFilters,
  statureCm: number | null,
): T[] {
  let result = exercises
  if (filters.suitableOnly && statureCm !== null) {
    result = result.filter((e) => isSuitableForStature(e, statureCm))
  }
  if (filters.muscleGroup !== null) {
    result = result.filter((e) => e.muscleGroup === filters.muscleGroup)
  }
  return filters.sort === 'votes'
    ? rankExercises(result)
    : [...result].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/** Come applyFiltersTo, sugli esercizi salvati sul dispositivo. */
export function applyFilters(data: AppData, filters: ExerciseFilters): Exercise[] {
  return applyFiltersTo(data.exercises, filters, data.profile.statureCm)
}
