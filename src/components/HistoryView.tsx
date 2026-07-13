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
import type { TextKey } from '../i18n'
import { useT } from '../i18n/context'
import { SelectField } from './SelectField'
import { TrendChart } from './TrendChart'

interface Props {
  data: AppData
}

const PERIODS = [
  { value: '', label: 'history.all' as const, days: null },
  { value: '30', label: 'history.last30' as const, days: 30 },
  { value: '90', label: 'history.last90' as const, days: 90 },
] as const

const METRICS: Array<{ value: TrendMetric; label: TextKey }> = [
  { value: 'maxWeight', label: 'history.maxWeight' as const },
  { value: 'totalReps', label: 'history.totalReps' as const },
  { value: 'maxReps', label: 'history.maxReps' as const },
  { value: 'volume', label: 'history.volume' as const },
]

export function HistoryView({ data }: Props) {
  const t = useT()
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
            {t('history.title')}
          </Typography>
          <Typography data-cy="history-empty">{t('history.empty')}</Typography>
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
            {t('history.trendTitle')}
          </Typography>
          <Stack
            direction="row"
            spacing={1.5}
            useFlexGap
            sx={{ flexWrap: 'wrap', alignItems: 'center' }}
          >
            <SelectField
              label={t('session.exercise')}
              value={selectedExerciseId}
              onChange={setSelectedExerciseId}
              dataCy="history-exercise-select"
              sx={{ minWidth: 210 }}
              options={[
                { value: '', label: t('session.chooseExercise') },
                ...trackedExercises.map((e) => ({ value: e.id, label: e.name })),
              ]}
            />
            <SelectField
              label={t('history.metric')}
              value={metric}
              onChange={(value) => setMetric(value as TrendMetric)}
              dataCy="metric-select"
              sx={{ minWidth: 200 }}
              options={METRICS.map((m) => ({ value: m.value, label: t(m.label) }))}
            />
            <SelectField
              label={t('history.period')}
              value={period}
              onChange={setPeriod}
              dataCy="period-select"
              sx={{ minWidth: 175 }}
              options={PERIODS.map((p) => ({ value: p.value, label: t(p.label) }))}
            />
          </Stack>
          {selectedExerciseId ? (
            <TrendChart points={trend} metric={metric} />
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {t('history.pickExercise')}
            </Typography>
          )}
        </CardContent>
      </Card>
      <Card component="section">
        <CardContent>
          <Typography variant="h2" gutterBottom>
            {t('history.title')}
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
