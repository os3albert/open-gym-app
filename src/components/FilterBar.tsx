import { useState, type FormEvent } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
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
    <Stack spacing={2} sx={{ mb: 2 }}>
      <Box
        component="form"
        onSubmit={handleStatureSubmit}
        sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}
      >
        <TextField
          label="La mia statura (cm)"
          type="number"
          placeholder="es. 180"
          value={statureInput}
          onChange={(e) => setStatureInput(e.target.value)}
          slotProps={{ htmlInput: { 'data-cy': 'stature-input' } }}
        />
        <Button type="submit" variant="outlined" size="small" data-cy="stature-save">
          Salva
        </Button>
      </Box>
      {statureError && (
        <Alert severity="error" role="alert" data-cy="stature-error">
          {statureError}
        </Alert>
      )}
      <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControlLabel
          label="Adatti a me"
          control={
            <Checkbox
              checked={filters.suitableOnly}
              onChange={(e) => onFiltersChange({ ...filters, suitableOnly: e.target.checked })}
              // Lo slot input di Checkbox non tipizza i data-*: cast al tipo HTML nativo
              slotProps={{
                input: {
                  'data-cy': 'filter-suitable',
                } as React.InputHTMLAttributes<HTMLInputElement>,
              }}
            />
          }
        />
        <TextField
          select
          label="Filtra per gruppo muscolare"
          value={filters.muscleGroup ?? ''}
          onChange={(e) => onFiltersChange({ ...filters, muscleGroup: e.target.value || null })}
          sx={{ minWidth: 220 }}
          slotProps={{
            select: { native: true },
            inputLabel: { shrink: true },
            htmlInput: { 'data-cy': 'filter-muscle' },
          }}
        >
          <option value="">Tutti</option>
          {muscleGroups.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </TextField>
        <TextField
          select
          label="Ordina per"
          value={filters.sort}
          onChange={(e) => onFiltersChange({ ...filters, sort: e.target.value as SortOrder })}
          sx={{ minWidth: 150 }}
          slotProps={{
            select: { native: true },
            inputLabel: { shrink: true },
            htmlInput: { 'data-cy': 'sort-select' },
          }}
        >
          <option value="votes">Più votati</option>
          <option value="recent">Più recenti</option>
        </TextField>
      </Stack>
      {requiresStature && (
        <Alert severity="warning" role="status" data-cy="stature-required">
          Per usare «Adatti a me» inserisci prima la tua statura qui sopra.
        </Alert>
      )}
      <Divider />
    </Stack>
  )
}
