import { useState, type FormEvent } from 'react'
import type { ExerciseFilters, SortOrder } from '../domain/filters'

interface Props {
  filters: ExerciseFilters
  onFiltersChange: (filters: ExerciseFilters) => void
  muscleGroups: string[]
  statureCm: number | null
  /** Lancia un errore se la statura non è plausibile. */
  onSaveStature: (statureCm: number) => void
  statureError: string | null
  /** Il filtro "Adatti a me" è attivo ma il profilo non ha una statura. */
  requiresStature: boolean
}

export function FilterBar({
  filters,
  onFiltersChange,
  muscleGroups,
  statureCm,
  onSaveStature,
  statureError,
  requiresStature,
}: Props) {
  const [statureInput, setStatureInput] = useState(statureCm === null ? '' : String(statureCm))

  function handleStatureSubmit(event: FormEvent) {
    event.preventDefault()
    onSaveStature(Number(statureInput))
  }

  return (
    <div className="filter-bar">
      <form className="stature-editor" onSubmit={handleStatureSubmit}>
        <label>
          La mia statura (cm)
          <input
            type="number"
            data-cy="stature-input"
            value={statureInput}
            onChange={(e) => setStatureInput(e.target.value)}
            placeholder="es. 180"
          />
        </label>
        <button type="submit" className="btn-small" data-cy="stature-save">
          Salva
        </button>
      </form>
      {statureError && (
        <p role="alert" data-cy="stature-error" className="error">
          {statureError}
        </p>
      )}
      <div className="filters-row">
        <label className="checkbox-label">
          <input
            type="checkbox"
            data-cy="filter-suitable"
            checked={filters.suitableOnly}
            onChange={(e) => onFiltersChange({ ...filters, suitableOnly: e.target.checked })}
          />
          Adatti a me
        </label>
        <label>
          Filtra per gruppo muscolare
          <select
            data-cy="filter-muscle"
            value={filters.muscleGroup ?? ''}
            onChange={(e) => onFiltersChange({ ...filters, muscleGroup: e.target.value || null })}
          >
            <option value="">Tutti</option>
            {muscleGroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </label>
        <label>
          Ordina per
          <select
            data-cy="sort-select"
            value={filters.sort}
            onChange={(e) => onFiltersChange({ ...filters, sort: e.target.value as SortOrder })}
          >
            <option value="votes">Più votati</option>
            <option value="recent">Più recenti</option>
          </select>
        </label>
      </div>
      {requiresStature && (
        <p data-cy="stature-required" className="warning" role="status">
          Per usare «Adatti a me» inserisci prima la tua statura qui sopra.
        </p>
      )}
    </div>
  )
}
