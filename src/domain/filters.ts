import { rankExercises } from './exercises'
import { MUSCLE_GROUPS } from './types'
import type { AppData, Difficulty, Exercise, MuscleGroup } from './types'

export type SortOrder = 'votes' | 'recent'

export interface ExerciseFilters {
  /** Ricerca per nome (M16): col catalogo a 1.300 voci si cerca, non si scorre. */
  text: string
  /** Mostra solo gli esercizi adatti alla statura del profilo ("Adatti a me"). */
  suitableOnly: boolean
  /** Gruppo muscolare esatto, null = tutti. */
  muscleGroup: MuscleGroup | null
  /** Grado di difficoltà, null = tutti. */
  difficulty: Difficulty | null
  sort: SortOrder
}

export const defaultFilters: ExerciseFilters = {
  text: '',
  suitableOnly: false,
  muscleGroup: null,
  difficulty: null,
  sort: 'votes',
}

/** Minuscole e senza accenti: «press» trova «Press», «trazioni» trova «Trazióni». */
function normalizeForSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
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

/** I gruppi davvero presenti nella lista: il filtro non offre voci che non filtrerebbero nulla. */
export function muscleGroups(exercises: Exercise[]): MuscleGroup[] {
  const presenti = new Set(exercises.map((e) => e.muscleGroup))
  return MUSCLE_GROUPS.filter((group) => presenti.has(group))
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
  const query = normalizeForSearch(filters.text)
  if (query !== '') {
    result = result.filter((e) => normalizeForSearch(e.name).includes(query))
  }
  if (filters.suitableOnly && statureCm !== null) {
    result = result.filter((e) => isSuitableForStature(e, statureCm))
  }
  if (filters.muscleGroup !== null) {
    result = result.filter((e) => e.muscleGroup === filters.muscleGroup)
  }
  if (filters.difficulty !== null) {
    result = result.filter((e) => e.difficulty === filters.difficulty)
  }
  return filters.sort === 'votes'
    ? rankExercises(result)
    : [...result].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/** Come applyFiltersTo, sugli esercizi salvati sul dispositivo. */
export function applyFilters(data: AppData, filters: ExerciseFilters): Exercise[] {
  return applyFiltersTo(data.exercises, filters, data.profile.statureCm)
}
