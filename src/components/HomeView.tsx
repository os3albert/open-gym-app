import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { weeklyProgress } from '../domain/activity'
import { activePlan } from '../domain/plans'
import type { AppData } from '../domain/types'
import { useT } from '../i18n/context'

interface Props {
  data: AppData
  today: string
  /** Apre l'allenamento con quel giorno già scelto (?giorno=…). */
  onOpenDay: (dayName: string) => void
  onGoToPlans: () => void
}

const WEEKDAY_SHORT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

/**
 * La Home (M16), l'atterraggio dell'app: il progresso della settimana e i giorni della scheda
 * attiva, ciascuno un tocco dall'allenamento. È il «cruscotto» chiesto con lo screenshot di
 * riferimento: card Weekly Progress con la striscia Lun–Dom, e sotto le cose da fare oggi.
 */
export function HomeView({ data, today, onOpenDay, onGoToPlans }: Props) {
  const t = useT()
  const week = weeklyProgress(data.activity, today)
  const plan = activePlan(data)
  const exerciseName = (id: string) => data.exercises.find((e) => e.id === id)?.name

  return (
    <Stack spacing={2} data-cy="home-view">
      <Card component="section">
        <CardContent>
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="h2">{t('home.weeklyProgress')}</Typography>
            <Chip
              size="small"
              color="primary"
              variant="outlined"
              label={t('home.thisWeek')}
              sx={{ flexShrink: 0 }}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {t('home.volumeAndIntensity')}
          </Typography>
          <WeeklyChart week={week} today={today} />
        </CardContent>
      </Card>

      <Box component="section">
        <Typography variant="h2" gutterBottom>
          {t('home.yourDays')}
        </Typography>
        {!plan ? (
          <Card variant="outlined">
            <CardContent>
              <Typography sx={{ mb: 1.5 }} data-cy="home-no-plan">
                {t('home.noPlan')}
              </Typography>
              <Button variant="contained" data-cy="home-go-to-plans" onClick={onGoToPlans}>
                {t('home.goToPlans')}
              </Button>
            </CardContent>
          </Card>
        ) : plan.days.length === 0 ? (
          <Typography color="text.secondary" data-cy="home-no-days">
            {t('home.planWithoutDays', { name: plan.name })}
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {plan.days.map((day) => (
              <Card key={day.name} variant="outlined" data-cy="home-day">
                <CardActionArea
                  data-cy="home-day-open"
                  aria-label={t('home.openDay', { day: day.name })}
                  onClick={() => onOpenDay(day.name)}
                  sx={{ p: 2 }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h3" component="h3" data-cy="home-day-name">
                        {day.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5, overflow: 'hidden', textOverflow: 'ellipsis' }}
                        noWrap
                      >
                        {day.entries.length === 0
                          ? t('home.dayEmpty')
                          : day.entries
                              .map((e) => exerciseName(e.exerciseId))
                              .filter(Boolean)
                              .slice(0, 3)
                              .join(' · ')}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      variant="outlined"
                      label={t('home.exerciseCount', { count: day.entries.length })}
                      sx={{ flexShrink: 0 }}
                    />
                  </Stack>
                </CardActionArea>
              </Card>
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  )
}

const WIDTH = 480
const HEIGHT = 150
const PAD = { top: 18, bottom: 30, side: 12 }

/**
 * La settimana in un colpo d'occhio: barre di volume (lime) e punto del carico massimo (viola)
 * per giorno, con la striscia Lun–Dom e l'oggi evidenziato. Stesso linguaggio dei grafici
 * dell'app: SVG a mano, colori dalle var per superficie.
 */
function WeeklyChart({ week, today }: { week: ReturnType<typeof weeklyProgress>; today: string }) {
  const t = useT()
  const trained = week.filter((d) => d.volume > 0)
  const maxVolume = Math.max(...week.map((d) => d.volume), 1)
  const maxWeight = Math.max(...week.map((d) => d.maxWeight), 1)
  const slot = (WIDTH - PAD.side * 2) / 7
  const barWidth = 26

  const label = t('home.weekChartLabel', {
    days: trained.length,
    volume: Math.round(trained.reduce((sum, d) => sum + d.volume, 0)),
  })

  if (trained.length === 0) {
    return (
      <>
        <Typography color="text.secondary" data-cy="home-week-empty" sx={{ py: 2 }}>
          {t('home.emptyWeek')}
        </Typography>
        <WeekStrip week={week} today={today} />
      </>
    )
  }

  return (
    <>
      <svg
        className="trend-chart"
        data-cy="home-week-chart"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={label}
      >
        {week.map((d, i) => {
          const cx = PAD.side + slot * i + slot / 2
          const barHeight =
            d.volume === 0 ? 0 : ((HEIGHT - PAD.top - PAD.bottom) * d.volume) / maxVolume
          const baseline = HEIGHT - PAD.bottom
          return (
            <g key={d.date}>
              <line
                x1={cx - barWidth / 2}
                x2={cx + barWidth / 2}
                y1={baseline}
                y2={baseline}
                className="grid-line"
              />
              {d.volume > 0 && (
                <>
                  <rect
                    className="week-bar"
                    x={cx - barWidth / 2}
                    y={baseline - barHeight}
                    width={barWidth}
                    height={barHeight}
                    rx={4}
                  >
                    <title>{`${WEEKDAY_SHORT[i]} — ${Math.round(d.volume)} kg×reps`}</title>
                  </rect>
                  <circle
                    className="trend-marker trend-marker-reps"
                    cx={cx}
                    cy={
                      PAD.top +
                      (HEIGHT - PAD.top - PAD.bottom) * (1 - d.maxWeight / maxWeight) * 0.9
                    }
                    r={3.5}
                  >
                    <title>{`${WEEKDAY_SHORT[i]} — max ${d.maxWeight} kg`}</title>
                  </circle>
                </>
              )}
              <text
                x={cx}
                y={HEIGHT - 8}
                textAnchor="middle"
                className={d.date === today ? 'axis-label weekday-today' : 'axis-label'}
              >
                {WEEKDAY_SHORT[i]}
              </text>
            </g>
          )
        })}
      </svg>
    </>
  )
}

/** La sola striscia dei giorni, per la settimana ancora vuota: l'oggi resta evidenziato. */
function WeekStrip({ week, today }: { week: ReturnType<typeof weeklyProgress>; today: string }) {
  return (
    <Stack direction="row" data-cy="home-week-strip" sx={{ justifyContent: 'space-between' }}>
      {week.map((d, i) => (
        <Typography
          key={d.date}
          component="span"
          variant="caption"
          sx={{
            px: 1,
            py: 0.25,
            borderRadius: 999,
            color: d.date === today ? 'primary.contrastText' : 'text.secondary',
            bgcolor: d.date === today ? 'primary.main' : 'transparent',
            fontWeight: d.date === today ? 700 : 400,
          }}
        >
          {WEEKDAY_SHORT[i]}
        </Typography>
      ))}
    </Stack>
  )
}
