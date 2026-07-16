import { useState } from 'react'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import CloseIcon from '@mui/icons-material/Close'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { translateError } from '../i18n'
import { useT } from '../i18n/context'
import type { Exercise, PlanEntry, WorkoutDay, WorkoutPlan } from '../domain/types'
import { range } from '../utils/number'
import { DayField } from './DayField'
import { NumberField } from './NumberField'
import { SelectField } from './SelectField'

export interface PlanEditorActions {
  renamePlan: (planId: string, name: string) => void
  addPlanDay: (planId: string, dayName: string) => void
  removePlanDay: (planId: string, dayName: string) => void
  addPlanEntry: (planId: string, dayName: string, entry: PlanEntry) => void
  removePlanEntry: (planId: string, dayName: string, exerciseId: string) => void
  movePlanEntry: (planId: string, dayName: string, exerciseId: string, direction: -1 | 1) => void
}

interface Props {
  plan: WorkoutPlan
  exercises: Exercise[]
  actions: PlanEditorActions
  onClose: () => void
}

const SETS = range(1, 10)
const REPS = range(1, 30)

/** Editor di una scheda: giorni (della settimana o generici) ed esercizi con target serie×reps. */
export function PlanEditor({ plan, exercises, actions, onClose }: Props) {
  const t = useT()
  const [name, setName] = useState(plan.name)
  const [dayName, setDayName] = useState('')
  const [error, setError] = useState<string | null>(null)

  function attempt(action: () => void) {
    try {
      action()
      setError(null)
      return true
    } catch (err) {
      setError(translateError(t, err))
      return false
    }
  }

  return (
    <Card component="section" data-cy="plan-editor">
      <CardContent>
        <Typography variant="h2" gutterBottom>
          {t('planEditor.title')}
        </Typography>
        <Stack
          direction="row"
          spacing={1.5}
          useFlexGap
          sx={{ flexWrap: 'wrap', alignItems: 'center', mb: 2 }}
        >
          <TextField
            label={t('planEditor.planName')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            slotProps={{ htmlInput: { 'data-cy': 'plan-rename-input' } }}
          />
          <Button
            size="small"
            variant="outlined"
            data-cy="plan-rename"
            onClick={() => attempt(() => actions.renamePlan(plan.id, name))}
          >
            {t('planEditor.rename')}
          </Button>
        </Stack>

        <Stack
          direction="row"
          spacing={1.5}
          useFlexGap
          sx={{ flexWrap: 'wrap', alignItems: 'center', mb: 2 }}
        >
          <DayField value={dayName} onChange={setDayName} dataCy="day-name-input" />
          <Button
            variant="contained"
            data-cy="add-day"
            onClick={() => {
              if (attempt(() => actions.addPlanDay(plan.id, dayName))) setDayName('')
            }}
          >
            {t('planEditor.addDay')}
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" role="alert" data-cy="editor-error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {plan.days.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            {t('planEditor.noDays')}
          </Typography>
        )}
        <Stack spacing={2}>
          {plan.days.map((day) => (
            <DayEditor
              key={day.name}
              day={day}
              exercises={exercises}
              onAddEntry={(entry) => attempt(() => actions.addPlanEntry(plan.id, day.name, entry))}
              onRemoveEntry={(exerciseId) =>
                attempt(() => actions.removePlanEntry(plan.id, day.name, exerciseId))
              }
              onMoveEntry={(exerciseId, direction) =>
                attempt(() => actions.movePlanEntry(plan.id, day.name, exerciseId, direction))
              }
              onRemoveDay={() => attempt(() => actions.removePlanDay(plan.id, day.name))}
            />
          ))}
        </Stack>

        <Stack direction="row" sx={{ mt: 2 }}>
          <Button color="inherit" data-cy="plan-editor-close" onClick={onClose}>
            {t('planEditor.close')}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}

interface DayProps {
  day: WorkoutDay
  exercises: Exercise[]
  onAddEntry: (entry: PlanEntry) => boolean
  onRemoveEntry: (exerciseId: string) => void
  onMoveEntry: (exerciseId: string, direction: -1 | 1) => void
  onRemoveDay: () => void
}

function DayEditor({
  day,
  exercises,
  onAddEntry,
  onRemoveEntry,
  onMoveEntry,
  onRemoveDay,
}: DayProps) {
  const t = useT()
  const [exerciseId, setExerciseId] = useState('')
  const [sets, setSets] = useState('3')
  const [reps, setReps] = useState('8')

  const exercisesByName = [...exercises].sort((a, b) => a.name.localeCompare(b.name))
  const exerciseName = (id: string) => exercises.find((e) => e.id === id)?.name ?? id

  return (
    <Box data-cy="plan-day" sx={{ border: 1, borderColor: 'divider', borderRadius: 3, p: 2 }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Typography variant="h3" component="h3" data-cy="plan-day-name">
          {day.name}
        </Typography>
        <Button
          size="small"
          color="inherit"
          data-cy="remove-day"
          aria-label={t('planEditor.removeDayLabel', { day: day.name })}
          onClick={onRemoveDay}
          sx={{ flexShrink: 0 }}
        >
          {t('planEditor.removeDay')}
        </Button>
      </Stack>

      {day.entries.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>
          {t('planEditor.dayEmpty')}
        </Typography>
      ) : (
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, my: 1 }}>
          {day.entries.map((entry, index) => (
            <Stack
              key={entry.exerciseId}
              component="li"
              direction="row"
              spacing={1}
              data-cy="plan-entry"
              sx={{
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 0.5,
                borderBottom: 1,
                borderColor: 'divider',
                '&:last-child': { borderBottom: 0 },
              }}
            >
              <Typography component="span" variant="body2" data-cy="plan-entry-text">
                {exerciseName(entry.exerciseId)} — {entry.sets}×{entry.reps}
              </Typography>
              <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                <IconButton
                  size="small"
                  data-cy="entry-up"
                  aria-label={t('planEditor.moveUp', {
                    name: exerciseName(entry.exerciseId),
                    day: day.name,
                  })}
                  disabled={index === 0}
                  onClick={() => onMoveEntry(entry.exerciseId, -1)}
                >
                  <ArrowUpwardIcon fontSize="inherit" />
                </IconButton>
                <IconButton
                  size="small"
                  data-cy="entry-down"
                  aria-label={t('planEditor.moveDown', {
                    name: exerciseName(entry.exerciseId),
                    day: day.name,
                  })}
                  disabled={index === day.entries.length - 1}
                  onClick={() => onMoveEntry(entry.exerciseId, 1)}
                >
                  <ArrowDownwardIcon fontSize="inherit" />
                </IconButton>
                <IconButton
                  size="small"
                  data-cy="remove-entry"
                  aria-label={t('planEditor.removeEntry', {
                    name: exerciseName(entry.exerciseId),
                    day: day.name,
                  })}
                  onClick={() => onRemoveEntry(entry.exerciseId)}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              </Stack>
            </Stack>
          ))}
        </Box>
      )}

      <Stack
        direction="row"
        spacing={1.5}
        useFlexGap
        sx={{ flexWrap: 'wrap', alignItems: 'center', mt: 1.5 }}
      >
        <SelectField
          label={t('session.exercise')}
          value={exerciseId}
          onChange={setExerciseId}
          dataCy="entry-exercise-select"
          sx={{ minWidth: 210 }}
          options={[
            { value: '', label: t('session.chooseExercise') },
            ...exercisesByName.map((e) => ({ value: e.id, label: e.name })),
          ]}
        />
        <NumberField
          label={t('planEditor.sets')}
          value={sets}
          onChange={setSets}
          dataCy="entry-sets"
          options={SETS}
          sx={{ width: 110 }}
        />
        <NumberField
          label={t('session.reps')}
          value={reps}
          onChange={setReps}
          dataCy="entry-reps"
          options={REPS}
          sx={{ width: 130 }}
        />
        <Button
          variant="contained"
          data-cy="add-entry"
          disabled={!exerciseId}
          onClick={() => {
            if (onAddEntry({ exerciseId, sets: Number(sets), reps: Number(reps) })) {
              setExerciseId('')
            }
          }}
        >
          {t('planEditor.add')}
        </Button>
      </Stack>
    </Box>
  )
}
