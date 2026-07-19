import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { WorkoutPlan } from '../domain/types'
import { useT } from '../i18n/context'
import { SelectField } from './SelectField'

interface Props {
  open: boolean
  plans: WorkoutPlan[]
  onClose: () => void
  /** Riceve l'id della scheda locale scelta: l'impacchettamento lo fa il chiamante. */
  onSubmit: (planId: string) => void
}

/**
 * «Proponi scheda»: si sceglie una delle proprie schede e la si pubblica nel catalogo
 * della community (con gli esercizi incorporati, come nella condivisione). Solo le schede
 * con almeno un esercizio si possono proporre: una scheda vuota non dà niente da provare.
 */
export function ProposePlanDialog({ open, plans, onClose, onSubmit }: Props) {
  const t = useT()
  const proposable = plans.filter((plan) => plan.days.some((day) => day.entries.length > 0))
  const [planId, setPlanId] = useState<string>('')
  const selected = planId !== '' ? planId : (proposable[0]?.id ?? '')

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="titolo-proposta-scheda"
      slotProps={{ paper: { sx: { m: { xs: 1.5, sm: 4 }, borderRadius: '24px' } } }}
    >
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography id="titolo-proposta-scheda" variant="h2">
          {t('community.proposePlanTitle')}
        </Typography>
        {proposable.length === 0 ? (
          <Typography color="text.secondary" data-cy="propose-plan-empty">
            {t('community.noPlansToPropose')}
          </Typography>
        ) : (
          <>
            <Typography color="text.secondary">{t('community.proposePlanHint')}</Typography>
            <SelectField
              label={t('community.planToPropose')}
              value={selected}
              onChange={setPlanId}
              options={proposable.map((plan) => ({ value: plan.id, label: plan.name }))}
              dataCy="propose-plan-select"
            />
          </>
        )}
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>{t('list.cancel')}</Button>
          {proposable.length > 0 && (
            <Button
              variant="contained"
              data-cy="propose-plan-submit"
              onClick={() => {
                onSubmit(selected)
                onClose()
              }}
            >
              {t('community.sendProposal')}
            </Button>
          )}
        </Stack>
      </Box>
    </Dialog>
  )
}
