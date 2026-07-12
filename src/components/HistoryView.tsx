import { useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import {
  exerciseHistory,
  filterByPeriod,
  sessionsByDate,
  type TrendMetric,
} from '../domain/activity'
import type { AppData } from '../domain/types'
import { formatDateIt, todayIso } from '../utils/date'
import { SelectField } from './SelectField'
import { TrendChart } from './TrendChart'

interface Props {
  data: AppData
}

const PERIODS = [
  { value: '', label: 'Tutto lo storico', days: null },
  { value: '30', label: 'Ultimi 30 giorni', days: 30 },
  { value: '90', label: 'Ultimi 90 giorni', days: 90 },
] as const

const METRICS: Array<{ value: TrendMetric; label: string }> = [
  { value: 'maxWeight', label: 'Peso massimo' },
  { value: 'totalReps', label: 'Ripetizioni totali' },
  { value: 'maxReps', label: 'Ripetizioni massime' },
  { value: 'volume', label: 'Volume (kg × reps)' },
]

export function HistoryView({ data }: Props) {
  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const [period, setPeriod] = useState<string>('')
  const [metric, setMetric] = useState<TrendMetric>('maxWeight')

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
    ? filterByPeriod(exerciseHistory(data.activity, selectedExerciseId, metric), days, todayIso())
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
            <SelectField
              label="Esercizio"
              value={selectedExerciseId}
              onChange={setSelectedExerciseId}
              dataCy="history-exercise-select"
              sx={{ minWidth: 210 }}
              options={[
                { value: '', label: 'Scegli un esercizio…' },
                ...trackedExercises.map((e) => ({ value: e.id, label: e.name })),
              ]}
            />
            <SelectField
              label="Metrica"
              value={metric}
              onChange={(value) => setMetric(value as TrendMetric)}
              dataCy="metric-select"
              sx={{ minWidth: 200 }}
              options={METRICS.map((m) => ({ value: m.value, label: m.label }))}
            />
            <SelectField
              label="Periodo"
              value={period}
              onChange={setPeriod}
              dataCy="period-select"
              sx={{ minWidth: 175 }}
              options={PERIODS.map((p) => ({ value: p.value, label: p.label }))}
            />
          </Stack>
          {selectedExerciseId ? (
            <TrendChart points={trend} metric={metric} />
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
