import { useState } from 'react'
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
import { lastSession, sessionsByDate } from '../domain/activity'
import type { AppData, WorkoutSet } from '../domain/types'
import { suggestNextWeight } from '../services/weightSuggestion'
import { formatDateIt } from '../utils/date'

interface Props {
  data: AppData
  today: string
  /** Lancia un errore se la serie non è valida. */
  onAddSet: (exerciseId: string, set: WorkoutSet) => void
  onRemoveSet: (recordId: string, setIndex: number) => void
}

/** Registrazione della sessione di oggi: pensata per l'uso in palestra (+/- rapidi, valori proposti). */
export function WorkoutSession({ data, today, onAddSet, onRemoveSet }: Props) {
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

  function step(value: string, delta: number, min: number): string {
    const next = Math.max(min, (Number(value) || 0) + delta)
    return String(Math.round(next * 10) / 10)
  }

  function handleAddSet() {
    try {
      onAddSet(exerciseId, { weightKg: Number(weight), reps: Number(reps) })
      setError(null)
      // Peso e ripetizioni restano compilati: la prossima serie si aggiunge con un tap
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Serie non valida')
    }
  }

  return (
    <Card component="section">
      <CardContent>
        <Typography variant="h2" gutterBottom>
          Allenamento di oggi
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {formatDateIt(today)} — registra serie, ripetizioni e peso.
        </Typography>
        {exercisesByName.length === 0 ? (
          <Typography data-cy="session-no-exercises">
            Non c'è ancora nessun esercizio: proponine uno nella scheda «Esercizi».
          </Typography>
        ) : (
          <Stack spacing={2}>
            <TextField
              select
              label="Esercizio"
              value={exerciseId}
              onChange={(e) => handleSelectExercise(e.target.value)}
              sx={{ maxWidth: 320 }}
              slotProps={{
                select: { native: true },
                htmlInput: { 'data-cy': 'session-exercise-select' },
              }}
            >
              <option value="">Scegli un esercizio…</option>
              {exercisesByName.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </TextField>
            <Stack direction="row" spacing={3} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                sx={{ flexWrap: 'wrap', alignItems: 'center' }}
              >
                <TextField
                  label="Peso (kg)"
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  sx={{ width: 110 }}
                  slotProps={{ htmlInput: { 'data-cy': 'set-weight', step: '0.5' } }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  data-cy="weight-minus"
                  aria-label="Diminuisci il peso di 2,5 kg"
                  onClick={() => setWeight((w) => step(w, -2.5, 0))}
                  sx={{ minWidth: 0 }}
                >
                  −2,5
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  data-cy="weight-plus"
                  aria-label="Aumenta il peso di 2,5 kg"
                  onClick={() => setWeight((w) => step(w, +2.5, 0))}
                  sx={{ minWidth: 0 }}
                >
                  +2,5
                </Button>
              </Stack>
              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                sx={{ flexWrap: 'wrap', alignItems: 'center' }}
              >
                <TextField
                  label="Ripetizioni"
                  type="number"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  sx={{ width: 110 }}
                  slotProps={{ htmlInput: { 'data-cy': 'set-reps' } }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  data-cy="reps-minus"
                  aria-label="Diminuisci le ripetizioni"
                  onClick={() => setReps((r) => step(r, -1, 1))}
                  sx={{ minWidth: 0 }}
                >
                  −1
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  data-cy="reps-plus"
                  aria-label="Aumenta le ripetizioni"
                  onClick={() => setReps((r) => step(r, +1, 1))}
                  sx={{ minWidth: 0 }}
                >
                  +1
                </Button>
              </Stack>
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
                Aggiungi serie
              </Button>
            </Stack>
          </Stack>
        )}

        {todayRecords.length > 0 && (
          <Box data-cy="today-session" sx={{ mt: 3 }}>
            <Typography variant="h3" component="h3" gutterBottom>
              Serie registrate oggi
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
                          aria-label={`Rimuovi la serie ${set.weightKg} kg × ${set.reps} di ${exerciseName(record.exerciseId)}`}
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
