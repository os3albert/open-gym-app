import { useEffect, useState } from 'react'
import { defaultFilters, type ExerciseFilters, type SortOrder } from '../domain/filters'
import { isDifficulty, isMuscleGroup, type Difficulty, type MuscleGroup } from '../domain/types'

// I filtri vivono nella query string così un set di filtri è condivisibile via URL.

function readFiltersFromUrl(): ExerciseFilters {
  const params = new URLSearchParams(window.location.search)
  const sort: SortOrder = params.get('ordina') === 'recenti' ? 'recent' : 'votes'
  return {
    text: params.get('q') ?? '',
    suitableOnly: params.get('adatti') === '1',
    muscleGroup: isMuscleGroup(params.get('gruppo')) ? (params.get('gruppo') as MuscleGroup) : null,
    difficulty: isDifficulty(params.get('difficolta'))
      ? (params.get('difficolta') as Difficulty)
      : null,
    sort,
  }
}

function writeFiltersToUrl(filters: ExerciseFilters): void {
  // Si toccano solo i parametri dei filtri: gli altri (es. ?vista=) restano intatti.
  // Ogni chiave si CANCELLA prima di riscriverla, o un filtro azzerato resterebbe
  // appiccicato all'URL (è successo a «difficolta», che qui mancava).
  const params = new URLSearchParams(window.location.search)
  params.delete('q')
  params.delete('adatti')
  params.delete('gruppo')
  params.delete('difficolta')
  params.delete('ordina')
  if (filters.text.trim()) params.set('q', filters.text)
  if (filters.suitableOnly) params.set('adatti', '1')
  if (filters.muscleGroup) params.set('gruppo', filters.muscleGroup)
  if (filters.difficulty) params.set('difficolta', filters.difficulty)
  if (filters.sort === 'recent') params.set('ordina', 'recenti')
  const query = params.toString()
  window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname)
}

export function useFilters(): [ExerciseFilters, (filters: ExerciseFilters) => void] {
  const [filters, setFilters] = useState<ExerciseFilters>(() => ({
    ...defaultFilters,
    ...readFiltersFromUrl(),
  }))

  useEffect(() => {
    writeFiltersToUrl(filters)
  }, [filters])

  return [filters, setFilters]
}
