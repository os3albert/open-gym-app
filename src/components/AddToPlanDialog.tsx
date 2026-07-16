import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { Exercise, WorkoutPlan } from '../domain/types'
import { translateError } from '../i18n'
import { useT } from '../i18n/context'
import { range } from '../utils/number'
import { NumberField } from './NumberField'
import { SelectField } from './SelectField'

const SETS = range(1, 10)
const REPS = range(1, 30)

export interface AddToPlanTarget {
  sets: number
  reps: number
}

interface Props {
  exercise: Exercise
  plans: WorkoutPlan[]
  activePlanId: string | null
  /** Lancia i codici del dominio (es. DUPLICATE_ENTRY): l'errore si mostra qui dentro. */
  onAdd: (exercise: Exercise, planId: string, dayName: string, target: AddToPlanTarget) => void
  onAdded: (planName: string, dayName: string) => void
  onClose: () => void
}

/**
 * Mette in una scheda un esercizio scelto dalla Community (M15): scheda, giorno e target
 * serie×reps, come nell'editor — ma senza uscire dalla lista.
 *
 * La scheda attiva è già scelta: è quella con cui ci si allena, ed è quasi sempre quella a cui
 * si vuole aggiungere.
 */
export function AddToPlanDialog({ exercise, plans, activePlanId, onAdd, onAdded, onClose }: Props) {
  const t = useT()
  const [planId, setPlanId] = useState(() => activePlanId ?? plans[0]?.id ?? '')
  const plan = plans.find((p) => p.id === planId) ?? null
  const [dayName, setDayName] = useState(() => plan?.days[0]?.name ?? '')
  const [sets, setSets] = useState('3')
  const [reps, setReps] = useState('8')
  const [error, setError] = useState<string | null>(null)

  // Cambiando scheda il giorno va riportato su uno che esista DAVVERO in quella nuova: lo si
  // fa qui nel gestore e non in un effetto, che sarebbe un setState dentro l'effetto.
  function scegliScheda(id: string) {
    setPlanId(id)
    setDayName(plans.find((p) => p.id === id)?.days[0]?.name ?? '')
    setError(null)
  }

  function aggiungi() {
    try {
      onAdd(exercise, planId, dayName, { sets: Number(sets), reps: Number(reps) })
      // A operazione riuscita il modale si chiude: finché un Dialog è aperto la lista dietro
      // è aria-hidden, e il messaggio di conferma non lo leggerebbe nessuno.
      onAdded(plan?.name ?? '', dayName)
      onClose()
    } catch (err) {
      setError(translateError(t, err))
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t('list.addToPlan')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" data-cy="add-to-plan-exercise">
          {exercise.name}
        </Typography>

        {plans.length === 0 ? (
          <Alert severity="info" role="status" data-cy="add-to-plan-no-plans" sx={{ mt: 2 }}>
            {t('addToPlan.noPlans')}
          </Alert>
        ) : (
          <Stack spacing={2} sx={{ mt: 2 }}>
            <SelectField
              label={t('addToPlan.plan')}
              value={planId}
              onChange={scegliScheda}
              dataCy="add-to-plan-plan"
              options={plans.map((p) => ({ value: p.id, label: p.name }))}
            />
            {plan && plan.days.length === 0 ? (
              <Alert severity="info" role="status" data-cy="add-to-plan-no-days">
                {t('addToPlan.noDays')}
              </Alert>
            ) : (
              <>
                <SelectField
                  label={t('addToPlan.day')}
                  value={dayName}
                  onChange={setDayName}
                  dataCy="add-to-plan-day"
                  options={(plan?.days ?? []).map((d) => ({ value: d.name, label: d.name }))}
                />
                <Stack direction="row" spacing={1.5}>
                  <NumberField
                    label={t('planEditor.sets')}
                    value={sets}
                    onChange={setSets}
                    dataCy="add-to-plan-sets"
                    options={SETS}
                    sx={{ width: 110 }}
                  />
                  <NumberField
                    label={t('session.reps')}
                    value={reps}
                    onChange={setReps}
                    dataCy="add-to-plan-reps"
                    options={REPS}
                    sx={{ width: 130 }}
                  />
                </Stack>
              </>
            )}
          </Stack>
        )}

        {error && (
          <Alert severity="error" role="alert" data-cy="add-to-plan-error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button color="inherit" data-cy="add-to-plan-cancel" onClick={onClose}>
          {t('list.cancel')}
        </Button>
        <Button
          variant="contained"
          data-cy="add-to-plan-confirm"
          disabled={!plan || plan.days.length === 0 || dayName === ''}
          onClick={aggiungi}
        >
          {t('addToPlan.add')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
