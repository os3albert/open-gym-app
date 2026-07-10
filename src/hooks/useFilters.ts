import { useEffect, useState } from 'react'
import { defaultFilters, type ExerciseFilters, type SortOrder } from '../domain/filters'

// I filtri vivono nella query string così un set di filtri è condivisibile via URL.

function readFiltersFromUrl(): ExerciseFilters {
  const params = new URLSearchParams(window.location.search)
  const sort: SortOrder = params.get('ordina') === 'recenti' ? 'recent' : 'votes'
  return {
    suitableOnly: params.get('adatti') === '1',
    muscleGroup: params.get('gruppo'),
    sort,
  }
}

function writeFiltersToUrl(filters: ExerciseFilters): void {
  // Si toccano solo i parametri dei filtri: gli altri (es. ?vista=) restano intatti
  const params = new URLSearchParams(window.location.search)
  params.delete('adatti')
  params.delete('gruppo')
  params.delete('ordina')
  if (filters.suitableOnly) params.set('adatti', '1')
  if (filters.muscleGroup) params.set('gruppo', filters.muscleGroup)
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
