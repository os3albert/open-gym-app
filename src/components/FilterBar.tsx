import { useState, type FormEvent } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import type { ExerciseFilters, SortOrder } from '../domain/filters'
import { DIFFICULTIES, type Difficulty, type MuscleGroup } from '../domain/types'
import { useT } from '../i18n/context'
import { range } from '../utils/number'
import { NumberField } from './NumberField'
import { SelectField } from './SelectField'

interface Props {
  filters: ExerciseFilters
  onFiltersChange: (filters: ExerciseFilters) => void
  muscleGroups: MuscleGroup[]
  statureCm: number | null
  /** Lancia un errore se la statura non è plausibile. */
  onSaveStature: (statureCm: number) => void
  statureError: string | null
  /** Il filtro "Adatti a me" è attivo ma il profilo non ha una statura. */
  requiresStature: boolean
}

const STATURES = range(100, 250)

export function FilterBar({
  filters,
  onFiltersChange,
  muscleGroups,
  statureCm,
  onSaveStature,
  statureError,
  requiresStature,
}: Props) {
  const t = useT()
  const [statureInput, setStatureInput] = useState(statureCm === null ? '' : String(statureCm))

  function handleStatureSubmit(event: FormEvent) {
    event.preventDefault()
    onSaveStature(Number(statureInput))
  }

  return (
    <Stack
      spacing={2}
      sx={{
        mb: 3,
        p: 2,
        borderRadius: '20px',
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Box
        component="form"
        onSubmit={handleStatureSubmit}
        sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}
      >
        <NumberField
          label={t('filters.myStature')}
          placeholder={t('filters.staturePlaceholder')}
          value={statureInput}
          onChange={setStatureInput}
          dataCy="stature-input"
          options={STATURES}
        />
        <Button type="submit" variant="outlined" size="small" data-cy="stature-save">
          {t('filters.save')}
        </Button>
      </Box>
      {statureError && (
        <Alert severity="error" role="alert" data-cy="stature-error">
          {statureError}
        </Alert>
      )}
      <Divider />
      <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControlLabel
          label={t('filters.suitableForMe')}
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
        <SelectField
          label={t('filters.muscleGroup')}
          value={filters.muscleGroup ?? ''}
          onChange={(value) =>
            onFiltersChange({ ...filters, muscleGroup: (value || null) as MuscleGroup | null })
          }
          dataCy="filter-muscle"
          sx={{ minWidth: 220 }}
          options={[
            { value: '', label: t('filters.all') },
            ...muscleGroups.map((group) => ({ value: group, label: t(`muscle.${group}`) })),
          ]}
        />
        <SelectField
          label={t('filters.difficulty')}
          value={filters.difficulty ?? ''}
          onChange={(value) =>
            onFiltersChange({ ...filters, difficulty: (value || null) as Difficulty | null })
          }
          dataCy="filter-difficulty"
          sx={{ minWidth: 160 }}
          options={[
            { value: '', label: t('filters.allDifficulties') },
            ...DIFFICULTIES.map((d) => ({ value: d, label: t(`difficulty.${d}`) })),
          ]}
        />
        <SelectField
          label={t('filters.sortBy')}
          value={filters.sort}
          onChange={(value) => onFiltersChange({ ...filters, sort: value as SortOrder })}
          dataCy="sort-select"
          sx={{ minWidth: 160 }}
          options={[
            { value: 'votes', label: t('filters.mostVoted') },
            { value: 'recent', label: t('filters.mostRecent') },
          ]}
        />
      </Stack>
      {requiresStature && (
        <Alert severity="warning" role="status" data-cy="stature-required">
          {t('filters.statureRequired')}
        </Alert>
      )}
    </Stack>
  )
}
