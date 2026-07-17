import { useRef, useState, type ReactNode } from 'react'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
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
import { exerciseHistory, filterByPeriod, isValidSet, lastSession } from '../domain/activity'
import { INVALID_SET_ERROR } from '../domain/activity'
import { useSetDrafts } from '../hooks/useSetDrafts'
import { activePlan, dayForDate, nextScheduledDay, planUsesWeekdays } from '../domain/plans'
import type { AppData, Exercise, PlanEntry, WorkoutSet } from '../domain/types'
import { translateError } from '../i18n'
import { useT } from '../i18n/context'
import { suggestNextWeight } from '../services/weightSuggestion'
import { DualTrendChart } from './DualTrendChart'
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
  /**
   * Giorno scelto da fuori (?giorno=, dalla Home): VINCE sul giorno della settimana — chi
   * clicca «Giorno B» di martedì vuole il Giorno B, non il martedì. Null = decide il calendario.
   */
  selectedDay: string | null
  onSelectDay: (day: string | null) => void
  /** Una serie è stata SPUNTATA (bozza): è il gesto fisico — parte la pausa del timer. */
  onSetDrafted: () => void
  /** Conferma nello storico le serie in bozza, nel giorno indicato: UN commit solo (M17). */
  onConfirmSets: (date: string, entries: Array<{ exerciseId: string; sets: WorkoutSet[] }>) => void
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
export function TodayWorkout({
  data,
  today,
  selectedDay,
  onSelectDay,
  onSetDrafted,
  onConfirmSets,
  onRemoveSet,
  fallback,
}: Props) {
  const t = useT()
  const carouselRef = useRef<HTMLDivElement>(null)
  const drafts = useSetDrafts(today)
  const plan = activePlan(data)

  /** Le bozze rimaste da un giorno passato si salvano NEL LORO giorno, mai in silenzio. */
  function salvaPending() {
    if (!drafts.pending) return
    const entries = Object.entries(drafts.pending.byExercise)
      // Un esercizio eliminato nel frattempo non deve far fallire il resto
      .filter(
        ([exerciseId, sets]) => sets.length > 0 && data.exercises.some((e) => e.id === exerciseId),
      )
      .map(([exerciseId, sets]) => ({ exerciseId, sets }))
    if (entries.length > 0) onConfirmSets(drafts.pending.date, entries)
    drafts.clearPending(drafts.pending.date)
  }

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
  // Il giorno scelto (dalla Home o dal menu qui sotto) vince sul calendario; un nome che
  // non esiste nella scheda attiva si ignora, come se non ci fosse
  const chosenDay = selectedDay ? (plan.days.find((d) => d.name === selectedDay) ?? null) : null
  const day = chosenDay ?? autoDay ?? null
  const restDay = !autoDay && !chosenDay && planUsesWeekdays(plan)
  const next = restDay ? nextScheduledDay(plan, today) : null

  return (
    <Stack spacing={2} data-cy="today-workout">
      <Box component="section">
        <Typography variant="h2" gutterBottom>
          {t('today.yourPlan', { name: plan.name })}
        </Typography>

        {/* Bozze di un giorno passato: spuntate ma mai confermate. Si decide, non si perde. */}
        {drafts.pending && (
          <Alert severity="warning" role="status" data-cy="pending-drafts" sx={{ mb: 2 }}>
            {t('today.pendingBanner', {
              count: Object.values(drafts.pending.byExercise).reduce(
                (sum, sets) => sum + sets.length,
                0,
              ),
              date: formatDateIt(drafts.pending.date),
            })}
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Button
                size="small"
                variant="contained"
                data-cy="pending-save"
                onClick={salvaPending}
              >
                {t('today.pendingSave')}
              </Button>
              <Button
                size="small"
                color="inherit"
                data-cy="pending-discard"
                onClick={() => drafts.pending && drafts.clearPending(drafts.pending.date)}
              >
                {t('today.pendingDiscard')}
              </Button>
            </Stack>
          </Alert>
        )}

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

        {/* Il menu si vede anche quando un giorno è già scelto da fuori: per cambiarlo,
            o per tornare al giorno del calendario (la voce vuota azzera ?giorno=) */}
        {(!autoDay || chosenDay) && (
          <SelectField
            label={restDay ? t('today.chooseDayAnyway') : t('today.whichDay')}
            value={chosenDay?.name ?? ''}
            onChange={(value) => onSelectDay(value === '' ? null : value)}
            dataCy="today-day-select"
            sx={{ minWidth: 260 }}
            options={[
              { value: '', label: autoDay ? t('today.backToToday') : t('today.choose') },
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
                drafts={drafts.draftsFor(entry.exerciseId)}
                onAddDraft={(set) => {
                  drafts.addDraft(entry.exerciseId, set)
                  onSetDrafted()
                }}
                onRemoveDraft={(i) => drafts.removeDraft(entry.exerciseId, i)}
                onConfirm={() => {
                  onConfirmSets(today, [
                    { exerciseId: entry.exerciseId, sets: drafts.draftsFor(entry.exerciseId) },
                  ])
                  drafts.clearDrafts(entry.exerciseId)
                }}
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
  /** Serie spuntate ma non ancora confermate nello storico (M17). */
  drafts: WorkoutSet[]
  onAddDraft: (set: WorkoutSet) => void
  onRemoveDraft: (index: number) => void
  /** Il gesto esplicito: le bozze entrano nello storico. */
  onConfirm: () => void
  onRemoveSet: (recordId: string, setIndex: number) => void
}

/** Una schermata del carosello: l'esercizio, il suo video e il log delle serie di oggi. */
function ExerciseCard({
  data,
  today,
  entry,
  position,
  total,
  drafts,
  onAddDraft,
  onRemoveDraft,
  onConfirm,
  onRemoveSet,
}: CardProps) {
  const t = useT()
  const exercise: Exercise | undefined = data.exercises.find((e) => e.id === entry.exerciseId)
  const record = data.activity.find((a) => a.exerciseId === entry.exerciseId && a.date === today)
  const done = record?.sets ?? []

  // Prefill dall'ULTIMA SESSIONE registrata (M17): il peso dal suggerimento del carico
  // (che è l'ultimo peso, +2,5 kg se l'ultima volta hai fatto 8+ reps ovunque), le
  // ripetizioni dall'ultima serie di quella sessione; senza storico, il target della scheda.
  const suggested = suggestNextWeight(data.activity, entry.exerciseId)
  const last = lastSession(data.activity, entry.exerciseId)
  const [weight, setWeight] = useState(suggested === null ? '' : String(suggested))
  const [reps, setReps] = useState(
    last ? String(last.sets[last.sets.length - 1].reps) : String(entry.reps),
  )
  const [extra, setExtra] = useState(0)
  const [error, setError] = useState<string | null>(null)

  if (!exercise) return null

  // Le righe previste dalla scheda, più le serie in più (fatte, in bozza o chieste a mano)
  const rows = Math.max(entry.sets, done.length + drafts.length) + extra

  // Le statistiche sotto il set log (M16): pesi e ripetizioni INSIEME, ultimi 30 giorni.
  // Registrare una serie le aggiorna in diretta: activity cambia, il grafico pure.
  const historyWeight = filterByPeriod(
    exerciseHistory(data.activity, entry.exerciseId, 'maxWeight'),
    30,
    today,
  )
  const historyReps = filterByPeriod(
    exerciseHistory(data.activity, entry.exerciseId, 'totalReps'),
    30,
    today,
  )

  // Spuntare = mettere in BOZZA (M17): lo storico si tocca solo col pulsante di conferma.
  // La validazione è la stessa del dominio, ma qui, prima che la serie entri in bozza.
  function spunta() {
    const set = { weightKg: Number(weight), reps: Number(reps) }
    if (!isValidSet(set)) {
      setError(translateError(t, new Error(INVALID_SET_ERROR)))
      return
    }
    setError(null)
    onAddDraft(set)
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
              // Dopo le confermate vengono le BOZZE (M17): spuntate, in attesa di conferma
              const bozza = fatta ? undefined : drafts[i - done.length]
              // Solo la prima riga libera si spunta: le serie si appendono in ordine,
              // e registrare la terza prima della seconda le scambierebbe di posto.
              const isNext = i === done.length + drafts.length
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
                  ) : bozza ? (
                    // In bozza: spuntata ma non ancora nello storico — si vede, e si può togliere
                    <>
                      <Box component="td" data-cy="set-row-draft-weight">
                        {bozza.weightKg}
                      </Box>
                      <Box component="td" data-cy="set-row-draft-reps">
                        {bozza.reps}
                      </Box>
                      <Box component="td">
                        <IconButton
                          size="small"
                          color="warning"
                          data-cy="set-row-draft"
                          aria-label={t('today.removeDraft', { set: i + 1, name: exercise.name })}
                          onClick={() => onRemoveDraft(i - done.length)}
                        >
                          <CheckCircleOutlinedIcon />
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
                          onClick={spunta}
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

        {/* Il gesto ESPLICITO chiesto in M17: finché non lo premi, lo storico non si tocca */}
        {drafts.length > 0 && (
          <Button
            fullWidth
            variant="contained"
            data-cy="today-confirm-history"
            onClick={onConfirm}
            sx={{ mt: 1.5 }}
          >
            {t('today.confirmHistory', { count: drafts.length })}
          </Button>
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

        {historyWeight.length > 0 && (
          <Box data-cy="today-stats" sx={{ mt: 1.5 }}>
            <Typography variant="h3" component="h4" sx={{ mb: 1 }}>
              {t('today.stats')}
            </Typography>
            <DualTrendChart weight={historyWeight} reps={historyReps} />
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
