import { useRef, useState, type ReactNode } from 'react'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { activePlan, dayForDate, nextScheduledDay, planUsesWeekdays } from '../domain/plans'
import type { AppData, Exercise, PlanEntry, WorkoutSet } from '../domain/types'
import { translateError } from '../i18n'
import { useT } from '../i18n/context'
import { suggestNextWeight } from '../services/weightSuggestion'
import { ExerciseMedia } from './ExerciseMedia'
import { formatDateIt } from '../utils/date'
import { range } from '../utils/number'
import { NumberField } from './NumberField'
import { SelectField } from './SelectField'

const WEIGHTS = range(0, 300, 2.5)
const REPS = range(1, 30)

interface Props {
  data: AppData
  today: string
  /** Registra UNA serie: il set log è fatto di righe, e una riga è una serie. */
  onRecordSet: (exerciseId: string, set: WorkoutSet) => void
  onRemoveSet: (recordId: string, setIndex: number) => void
  /** Cosa mostrare quando oggi non c'è nulla in programma: la registrazione libera. */
  fallback: ReactNode
}

/**
 * L'allenamento del giorno, dalla scheda attiva.
 *
 * Da M14 è un CAROSELLO: un esercizio per schermata, che scorre in orizzontale con lo swipe.
 * Ogni card porta il video (per rivedere l'esecuzione mentre si è sotto il bilanciere) e il set
 * log, riga per riga. Lo scorrimento è CSS puro (scroll-snap): nessuna libreria, come il grafico.
 *
 * Se oggi non c'è nulla in programma — nessuna scheda attiva, o giorno di riposo — si mostra il
 * `fallback`: senza, chi non ha ancora una scheda troverebbe una vista che non fa niente.
 */
export function TodayWorkout({ data, today, onRecordSet, onRemoveSet, fallback }: Props) {
  const t = useT()
  const [manualDayName, setManualDayName] = useState('')
  const carouselRef = useRef<HTMLDivElement>(null)
  const plan = activePlan(data)

  /**
   * Porta il carosello alla card accanto. Lo swipe da solo non basta: con lo snap «mandatory»
   * la rotella del mouse muove meno di mezza card e viene sempre riagganciata alla card di
   * partenza (su desktop non si avanzava mai), e la scrollbar è nascosta apposta.
   */
  function scorri(direction: 1 | -1) {
    const el = carouselRef.current
    if (!el) return
    const cards = Array.from(el.querySelectorAll<HTMLElement>('[data-cy=today-entry]'))
    if (cards.length === 0) return
    // La card più vicina al centro della finestra di scorrimento: da lì si va alla vicina
    const center = el.scrollLeft + el.clientWidth / 2
    let nearest = 0
    let bestDistance = Number.POSITIVE_INFINITY
    cards.forEach((card, i) => {
      const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center)
      if (distance < bestDistance) {
        bestDistance = distance
        nearest = i
      }
    })
    const target = cards[Math.max(0, Math.min(cards.length - 1, nearest + direction))]
    // jsdom non implementa scrollIntoView: il click non deve crollare nei test
    target.scrollIntoView?.({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  if (!plan || plan.days.length === 0) return <>{fallback}</>

  const autoDay = dayForDate(plan, today)
  const day = autoDay ?? plan.days.find((d) => d.name === manualDayName) ?? null
  const restDay = !autoDay && planUsesWeekdays(plan)
  const next = restDay ? nextScheduledDay(plan, today) : null

  return (
    <Stack spacing={2} data-cy="today-workout">
      <Box component="section">
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
      </Box>

      {day === null ? (
        fallback
      ) : day.entries.length === 0 ? (
        <Typography variant="body2" color="text.secondary" data-cy="today-day-name">
          {t('today.dayEmpty')}
        </Typography>
      ) : (
        <>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography
              variant="body2"
              color="text.secondary"
              data-cy="today-day-name"
              sx={{ flex: 1 }}
            >
              {t('today.dayHint', { name: day.name })}
            </Typography>
            <IconButton
              size="small"
              data-cy="today-prev"
              aria-label={t('today.prevExercise')}
              onClick={() => scorri(-1)}
            >
              <ChevronLeftIcon />
            </IconButton>
            <IconButton
              size="small"
              data-cy="today-next"
              aria-label={t('today.nextExercise')}
              onClick={() => scorri(1)}
            >
              <ChevronRightIcon />
            </IconButton>
          </Stack>
          {/* Il carosello: una card per esercizio, agganciata al centro dello scorrimento */}
          <Box
            ref={carouselRef}
            data-cy="today-carousel"
            sx={{
              display: 'flex',
              gap: 2,
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              pb: 1,
              // Ai bordi un margine largo quanto ciò che resta accanto a una card (86%):
              // senza, la prima e l'ultima non possono centrarsi e lo snap le lascia a metà.
              px: { xs: '7%', sm: 2 },
              // La barra di scorrimento non serve: si scorre col dito (o con le frecce qui sopra)
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            {day.entries.map((entry, index) => (
              <ExerciseCard
                key={entry.exerciseId}
                data={data}
                today={today}
                entry={entry}
                position={index + 1}
                total={day.entries.length}
                onRecordSet={onRecordSet}
                onRemoveSet={onRemoveSet}
              />
            ))}
          </Box>
        </>
      )}
    </Stack>
  )
}

interface CardProps {
  data: AppData
  today: string
  entry: PlanEntry
  position: number
  total: number
  onRecordSet: (exerciseId: string, set: WorkoutSet) => void
  onRemoveSet: (recordId: string, setIndex: number) => void
}

/** Una schermata del carosello: l'esercizio, il suo video e il log delle serie di oggi. */
function ExerciseCard({
  data,
  today,
  entry,
  position,
  total,
  onRecordSet,
  onRemoveSet,
}: CardProps) {
  const t = useT()
  const exercise: Exercise | undefined = data.exercises.find((e) => e.id === entry.exerciseId)
  const record = data.activity.find((a) => a.exerciseId === entry.exerciseId && a.date === today)
  const done = record?.sets ?? []

  const suggested = suggestNextWeight(data.activity, entry.exerciseId)
  const [weight, setWeight] = useState(suggested === null ? '' : String(suggested))
  const [reps, setReps] = useState(String(entry.reps))
  const [extra, setExtra] = useState(0)
  const [error, setError] = useState<string | null>(null)

  if (!exercise) return null

  // Le righe previste dalla scheda, più le serie in più (fatte o chieste a mano)
  const rows = Math.max(entry.sets, done.length) + extra

  function registra() {
    try {
      onRecordSet(entry.exerciseId, { weightKg: Number(weight), reps: Number(reps) })
      setError(null)
    } catch (err) {
      setError(translateError(t, err))
    }
  }

  return (
    <Card
      data-cy="today-entry"
      sx={{
        scrollSnapAlign: 'center',
        // Un fling non salta gli esercizi: ci si ferma su ogni card
        scrollSnapStop: 'always',
        flex: '0 0 auto',
        // 100% del content-box del carosello = 86% della pagina (il padding del 7% per lato
        // sta sul contenitore): la card centrata lascia spuntare le vicine.
        width: { xs: '100%', sm: 420 },
        maxWidth: '100%',
      }}
    >
      {/* Video, o GIF animata del catalogo: com'è fatto l'esercizio si vede da qui */}
      <ExerciseMedia exercise={exercise} />
      <CardContent>
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ alignItems: 'center', flexWrap: 'wrap' }}
        >
          <Typography variant="h3" component="h3" sx={{ flex: 1 }}>
            {exercise.name}
          </Typography>
          <Chip size="small" variant="outlined" label={t(`difficulty.${exercise.difficulty}`)} />
        </Stack>
        <Typography variant="overline" color="text.secondary" data-cy="today-entry-position">
          {t('today.position', { position, total })}
        </Typography>

        {exercise.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {exercise.description}
          </Typography>
        )}

        <Typography variant="h3" component="h4" sx={{ mt: 2.5, mb: 1 }}>
          {t('today.setLog')}
        </Typography>

        <Box component="table" data-cy="set-log" sx={{ width: '100%', borderCollapse: 'collapse' }}>
          <Box component="thead">
            <Box component="tr" sx={{ '& th': { textAlign: 'left', pb: 1 } }}>
              <Typography component="th" variant="overline" color="text.secondary">
                {t('today.setNumber')}
              </Typography>
              <Typography component="th" variant="overline" color="text.secondary">
                {t('session.weight')}
              </Typography>
              <Typography component="th" variant="overline" color="text.secondary">
                {t('session.reps')}
              </Typography>
              <Typography component="th" variant="overline" color="text.secondary">
                {t('today.status')}
              </Typography>
            </Box>
          </Box>
          <Box component="tbody">
            {Array.from({ length: rows }, (_, i) => {
              const fatta = done[i]
              // Solo la prima riga non ancora fatta si registra: le serie si appendono in ordine,
              // e registrare la terza prima della seconda le scambierebbe di posto.
              const isNext = i === done.length
              return (
                <Box
                  component="tr"
                  key={i}
                  data-cy="set-row"
                  sx={{ '& td': { py: 0.75, borderTop: 1, borderColor: 'divider' } }}
                >
                  <Box component="td" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                    {i + 1}
                  </Box>
                  {fatta ? (
                    <>
                      <Box component="td" data-cy="set-row-weight">
                        {fatta.weightKg}
                      </Box>
                      <Box component="td" data-cy="set-row-reps">
                        {fatta.reps}
                      </Box>
                      <Box component="td">
                        <IconButton
                          size="small"
                          color="success"
                          data-cy="set-row-done"
                          aria-label={t('today.removeSet', { set: i + 1, name: exercise.name })}
                          onClick={() => record && onRemoveSet(record.id, i)}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </Box>
                    </>
                  ) : isNext ? (
                    <>
                      <Box component="td" sx={{ pr: 1 }}>
                        <NumberField
                          label={t('session.weight')}
                          value={weight}
                          onChange={setWeight}
                          dataCy="today-weight"
                          options={WEIGHTS}
                          sx={{ width: 96 }}
                        />
                      </Box>
                      <Box component="td" sx={{ pr: 1 }}>
                        <NumberField
                          label={t('session.reps')}
                          value={reps}
                          onChange={setReps}
                          dataCy="today-reps"
                          options={REPS}
                          sx={{ width: 96 }}
                        />
                      </Box>
                      <Box component="td">
                        <IconButton
                          size="small"
                          color="primary"
                          data-cy="set-row-record"
                          aria-label={t('today.recordSet', { set: i + 1, name: exercise.name })}
                          onClick={registra}
                        >
                          <RadioButtonUncheckedIcon />
                        </IconButton>
                      </Box>
                    </>
                  ) : (
                    // Righe più in là: si vede il target, ma non è ancora il loro turno
                    <>
                      <Box component="td" sx={{ color: 'text.disabled' }}>
                        —
                      </Box>
                      <Box component="td" sx={{ color: 'text.disabled' }}>
                        {entry.reps}
                      </Box>
                      <Box component="td">
                        <RadioButtonUncheckedIcon fontSize="small" color="disabled" />
                      </Box>
                    </>
                  )}
                </Box>
              )
            })}
          </Box>
        </Box>

        {error && (
          <Alert severity="error" role="alert" data-cy="session-error" sx={{ mt: 1.5 }}>
            {error}
          </Alert>
        )}

        <Button
          fullWidth
          color="inherit"
          data-cy="today-add-set"
          onClick={() => setExtra((n) => n + 1)}
          sx={{ mt: 1.5, borderTop: 1, borderColor: 'divider', borderRadius: 0 }}
        >
          {t('today.addSet')}
        </Button>
      </CardContent>
    </Card>
  )
}
