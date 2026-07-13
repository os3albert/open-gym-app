import { useState } from 'react'
import CloseIcon from '@mui/icons-material/Close'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { lastSession, sessionsByDate } from '../domain/activity'
import { translateError } from '../i18n'
import { useT } from '../i18n/context'
import type { AppData, WorkoutSet } from '../domain/types'
import { suggestNextWeight } from '../services/weightSuggestion'
import { formatDateIt } from '../utils/date'
import { NumberField, range } from './NumberField'
import { SelectField } from './SelectField'

interface Props {
  data: AppData
  today: string
  /** Lancia un errore se la serie non è valida. */
  onAddSet: (exerciseId: string, set: WorkoutSet) => void
  onRemoveSet: (recordId: string, setIndex: number) => void
}

/** Registrazione della sessione di oggi: pensata per l'uso in palestra (+/- rapidi, valori proposti). */
/** Le scale della palestra: carichi a passi di 2,5 kg, ripetizioni fino a 30. */
const WEIGHTS = range(0, 300, 2.5)
const REPS = range(1, 30)

export function WorkoutSession({ data, today, onAddSet, onRemoveSet }: Props) {
  const t = useT()
  const [exerciseId, setExerciseId] = useState('')
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [error, setError] = useState<string | null>(null)

  const exercisesByName = [...data.exercises].sort((a, b) => a.name.localeCompare(b.name))
  const todayRecords = sessionsByDate(data.activity).find((s) => s.date === today)?.records ?? []
  const exerciseName = (id: string) => data.exercises.find((e) => e.id === id)?.name ?? id

  function handleSelectExercise(id: string) {
    setExerciseId(id)
    setError(null)
    if (!id) return
    // Il carico viene proposto dallo storico (issue #16); senza storico i campi restano vuoti
    const suggested = suggestNextWeight(data.activity, id)
    setWeight(suggested === null ? '' : String(suggested))
    const last = lastSession(data.activity, id)
    setReps(last === null ? '' : String(last.sets[last.sets.length - 1].reps))
  }

  function handleAddSet() {
    try {
      onAddSet(exerciseId, { weightKg: Number(weight), reps: Number(reps) })
      setError(null)
      // Peso e ripetizioni restano compilati: la prossima serie si aggiunge con un tap
    } catch (err) {
      setError(translateError(t, err))
    }
  }

  return (
    <Card component="section">
      <CardContent>
        <Typography variant="h2" gutterBottom>
          {t('session.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('session.subtitle', { date: formatDateIt(today) })}
        </Typography>
        {exercisesByName.length === 0 ? (
          <Typography data-cy="session-no-exercises">{t('session.noExercises')}</Typography>
        ) : (
          <Stack spacing={2}>
            <SelectField
              label={t('session.exercise')}
              value={exerciseId}
              onChange={handleSelectExercise}
              dataCy="session-exercise-select"
              sx={{ maxWidth: 320 }}
              options={[
                { value: '', label: t('session.chooseExercise') },
                ...exercisesByName.map((e) => ({ value: e.id, label: e.name })),
              ]}
            />
            <Stack direction="row" spacing={3} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <NumberField
                label={t('session.weight')}
                value={weight}
                onChange={setWeight}
                dataCy="set-weight"
                options={WEIGHTS}
                sx={{ width: 130 }}
                stepper={{
                  step: 2.5,
                  min: 0,
                  decreaseCy: 'weight-minus',
                  increaseCy: 'weight-plus',
                  decreaseLabel: t('session.weightMinus'),
                  increaseLabel: t('session.weightPlus'),
                }}
              />
              <NumberField
                label={t('session.reps')}
                value={reps}
                onChange={setReps}
                dataCy="set-reps"
                options={REPS}
                sx={{ width: 130 }}
                stepper={{
                  step: 1,
                  min: 1,
                  decreaseCy: 'reps-minus',
                  increaseCy: 'reps-plus',
                  decreaseLabel: t('session.repsMinus'),
                  increaseLabel: t('session.repsPlus'),
                }}
              />
            </Stack>
            {error && (
              <Alert severity="error" role="alert" data-cy="session-error">
                {error}
              </Alert>
            )}
            <Stack direction="row">
              <Button
                variant="contained"
                data-cy="add-set"
                disabled={!exerciseId}
                onClick={handleAddSet}
              >
                {t('session.addSet')}
              </Button>
            </Stack>
          </Stack>
        )}

        {todayRecords.length > 0 && (
          <Box data-cy="today-session" sx={{ mt: 3 }}>
            <Typography variant="h3" component="h3" gutterBottom>
              {t('session.todaySets')}
            </Typography>
            <Stack component="ul" spacing={1.5} sx={{ listStyle: 'none', m: 0, p: 0 }}>
              {todayRecords.map((record) => (
                <Stack
                  key={record.id}
                  component="li"
                  direction="row"
                  spacing={1.5}
                  useFlexGap
                  data-cy="today-record"
                  sx={{ flexWrap: 'wrap', alignItems: 'center' }}
                >
                  <Typography component="strong" sx={{ fontWeight: 600 }}>
                    {exerciseName(record.exerciseId)}
                  </Typography>
                  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                    {record.sets.map((set, index) => (
                      <Box
                        component="span"
                        data-cy="set-chip"
                        key={index}
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5,
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 999,
                          pl: 1.5,
                          pr: 0.5,
                          py: 0.25,
                          fontSize: '0.875rem',
                        }}
                      >
                        {set.weightKg} kg × {set.reps}
                        <IconButton
                          size="small"
                          data-cy="remove-set"
                          aria-label={t('session.removeSet', {
                            weight: set.weightKg,
                            reps: set.reps,
                            name: exerciseName(record.exerciseId),
                          })}
                          onClick={() => onRemoveSet(record.id, index)}
                        >
                          <CloseIcon sx={{ fontSize: '0.9rem' }} />
                        </IconButton>
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
