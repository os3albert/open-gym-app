import { useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { exerciseHistory, filterByPeriod, sessionsByDate } from '../domain/activity'
import type { AppData } from '../domain/types'
import { formatDateIt, todayIso } from '../utils/date'
import { TrendChart } from './TrendChart'

interface Props {
  data: AppData
}

const PERIODS = [
  { value: '', label: 'Tutto lo storico', days: null },
  { value: '30', label: 'Ultimi 30 giorni', days: 30 },
  { value: '90', label: 'Ultimi 90 giorni', days: 90 },
] as const

export function HistoryView({ data }: Props) {
  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const [period, setPeriod] = useState<string>('')

  const sessions = sessionsByDate(data.activity)
  const exerciseName = (id: string) => data.exercises.find((e) => e.id === id)?.name ?? id
  const trackedExercises = data.exercises
    .filter((e) => data.activity.some((a) => a.exerciseId === e.id))
    .sort((a, b) => a.name.localeCompare(b.name))

  if (sessions.length === 0) {
    return (
      <Card component="section">
        <CardContent>
          <Typography variant="h2" gutterBottom>
            Storico allenamenti
          </Typography>
          <Typography data-cy="history-empty">
            Nessuna sessione registrata: inizia dalla scheda «Allenamento».
          </Typography>
        </CardContent>
      </Card>
    )
  }

  const days = PERIODS.find((p) => p.value === period)?.days ?? null
  const trend = selectedExerciseId
    ? filterByPeriod(exerciseHistory(data.activity, selectedExerciseId), days, todayIso())
    : []

  return (
    <>
      <Card component="section">
        <CardContent>
          <Typography variant="h2" gutterBottom>
            Andamento del carico
          </Typography>
          <Stack
            direction="row"
            spacing={1.5}
            useFlexGap
            sx={{ flexWrap: 'wrap', alignItems: 'center' }}
          >
            <TextField
              select
              label="Esercizio"
              value={selectedExerciseId}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
              sx={{ minWidth: 210 }}
              slotProps={{
                select: { native: true },
                inputLabel: { shrink: true },
                htmlInput: { 'data-cy': 'history-exercise-select' },
              }}
            >
              <option value="">Scegli un esercizio…</option>
              {trackedExercises.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </TextField>
            <TextField
              select
              label="Periodo"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              sx={{ minWidth: 170 }}
              slotProps={{
                select: { native: true },
                inputLabel: { shrink: true },
                htmlInput: { 'data-cy': 'period-select' },
              }}
            >
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </TextField>
          </Stack>
          {selectedExerciseId ? (
            <TrendChart points={trend} />
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Scegli un esercizio per vedere l'andamento del peso nel tempo.
            </Typography>
          )}
        </CardContent>
      </Card>
      <Card component="section">
        <CardContent>
          <Typography variant="h2" gutterBottom>
            Storico allenamenti
          </Typography>
          <Stack component="ul" spacing={2} sx={{ listStyle: 'none', m: 0, p: 0 }}>
            {sessions.map((session) => (
              <Box component="li" key={session.date} data-cy="session-item">
                <Typography variant="h3" component="h3" gutterBottom>
                  {formatDateIt(session.date)}
                </Typography>
                <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
                  {session.records.map((record) => (
                    <Typography
                      component="li"
                      variant="body2"
                      color="text.secondary"
                      key={record.id}
                      data-cy="session-exercise"
                      sx={{ py: 0.25 }}
                    >
                      <Box component="strong" sx={{ color: 'text.primary', fontWeight: 600 }}>
                        {exerciseName(record.exerciseId)}
                      </Box>
                      : {record.sets.map((s) => `${s.weightKg} kg × ${s.reps}`).join(', ')}
                    </Typography>
                  ))}
                </Box>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </>
  )
}
