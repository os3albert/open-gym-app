import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { activePlan, dayForDate, nextScheduledDay, planUsesWeekdays } from '../domain/plans'
import { translateError } from '../i18n'
import { useT } from '../i18n/context'
import type { AppData, Exercise, PlanEntry, WorkoutSet } from '../domain/types'
import { suggestNextWeight } from '../services/weightSuggestion'
import { formatDateIt } from '../utils/date'
import { NumberField, range } from './NumberField'
import { SelectField } from './SelectField'

interface Props {
  data: AppData
  today: string
  /** Registra tutte le serie previste dall'esercizio della scheda. Lancia se non valide. */
  onComplete: (exerciseId: string, sets: number, set: WorkoutSet) => void
}

/**
 * L'allenamento del giorno dalla scheda attiva (issue #19): esercizi previsti oggi,
 * peso proposto dallo storico, «Fatto ✓» che registra la sessione nello storico.
 */
const WEIGHTS = range(0, 300, 2.5)
const REPS = range(1, 30)

export function TodayWorkout({ data, today, onComplete }: Props) {
  const t = useT()
  const [manualDayName, setManualDayName] = useState('')
  const plan = activePlan(data)
  if (!plan || plan.days.length === 0) return null

  const autoDay = dayForDate(plan, today)
  const day = autoDay ?? plan.days.find((d) => d.name === manualDayName) ?? null
  const restDay = !autoDay && planUsesWeekdays(plan)
  const next = restDay ? nextScheduledDay(plan, today) : null

  return (
    <Card component="section" data-cy="today-workout">
      <CardContent>
        <Typography variant="h2" gutterBottom>
          {t('today.yourPlan', { name: plan.name })}
        </Typography>

        {restDay && !day && (
          <Typography data-cy="rest-day" sx={{ mb: 2 }}>
            {t('today.restDay')}{' '}
            {next && (
              <span data-cy="next-workout">
                {t('today.nextWorkout')} <strong>{next.day.name}</strong> ({formatDateIt(next.date)}
                )
              </span>
            )}
          </Typography>
        )}

        {!autoDay && (
          <SelectField
            label={restDay ? t('today.chooseDayAnyway') : t('today.whichDay')}
            value={manualDayName}
            onChange={setManualDayName}
            dataCy="today-day-select"
            sx={{ minWidth: 260 }}
            options={[
              { value: '', label: t('today.choose') },
              ...plan.days.map((d) => ({ value: d.name, label: d.name })),
            ]}
          />
        )}

        {day && (
          <>
            <Typography
              variant="body2"
              color="text.secondary"
              data-cy="today-day-name"
              sx={{ my: 1.5 }}
            >
              {t('today.dayHint', { name: day.name })}
            </Typography>
            {day.entries.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {t('today.dayEmpty')}
              </Typography>
            ) : (
              <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 2 }}>
                {day.entries.map((entry) => {
                  const exercise = data.exercises.find((e) => e.id === entry.exerciseId)
                  if (!exercise) return null
                  const done = data.activity.some(
                    (a) => a.exerciseId === entry.exerciseId && a.date === today,
                  )
                  return (
                    <TodayEntry
                      key={entry.exerciseId}
                      exercise={exercise}
                      entry={entry}
                      done={done}
                      suggestedWeight={suggestNextWeight(data.activity, entry.exerciseId)}
                      onComplete={onComplete}
                    />
                  )
                })}
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

interface EntryProps {
  exercise: Exercise
  entry: PlanEntry
  done: boolean
  suggestedWeight: number | null
  onComplete: (exerciseId: string, sets: number, set: WorkoutSet) => void
}

function TodayEntry({ exercise, entry, done, suggestedWeight, onComplete }: EntryProps) {
  const t = useT()
  const [weight, setWeight] = useState(suggestedWeight === null ? '' : String(suggestedWeight))
  const [reps, setReps] = useState(String(entry.reps))
  const [skipped, setSkipped] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleComplete() {
    try {
      onComplete(exercise.id, entry.sets, { weightKg: Number(weight), reps: Number(reps) })
      setError(null)
    } catch (err) {
      setError(translateError(t, err))
    }
  }

  return (
    <Box
      component="li"
      data-cy="today-entry"
      sx={{ border: 1, borderColor: 'divider', borderRadius: 3, p: 2 }}
    >
      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        sx={{ flexWrap: 'wrap', alignItems: 'baseline', mb: done || skipped ? 1 : 1.5 }}
      >
        <Typography component="strong" sx={{ fontWeight: 600 }}>
          {exercise.name}
        </Typography>
        <Typography
          component="span"
          variant="body2"
          color="text.secondary"
          data-cy="today-entry-target"
        >
          {entry.sets}×{entry.reps}
        </Typography>
      </Stack>
      {done ? (
        <Chip
          size="small"
          color="success"
          variant="outlined"
          data-cy="today-entry-done"
          label={t('today.done')}
        />
      ) : skipped ? (
        <Typography component="span" variant="body2" data-cy="today-entry-skipped">
          {t('today.skipped')}{' '}
          <Button
            size="small"
            color="inherit"
            data-cy="today-entry-unskip"
            onClick={() => setSkipped(false)}
          >
            {t('today.undoSkip')}
          </Button>
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          <Stack
            direction="row"
            spacing={1.5}
            useFlexGap
            sx={{ flexWrap: 'wrap', alignItems: 'center' }}
          >
            <NumberField
              label={t('session.weight')}
              value={weight}
              onChange={setWeight}
              dataCy="today-weight"
              options={WEIGHTS}
              sx={{ width: 130 }}
            />
            <NumberField
              label={t('session.reps')}
              value={reps}
              onChange={setReps}
              dataCy="today-reps"
              options={REPS}
              sx={{ width: 130 }}
            />
            <Button variant="contained" data-cy="today-entry-complete" onClick={handleComplete}>
              {t('today.complete')}
            </Button>
            <Button
              size="small"
              color="inherit"
              data-cy="today-entry-skip"
              onClick={() => setSkipped(true)}
            >
              {t('today.skip')}
            </Button>
          </Stack>
          {error && (
            <Alert severity="error" role="alert" data-cy="today-entry-error">
              {error}
            </Alert>
          )}
        </Stack>
      )}
    </Box>
  )
}
