import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { translateError } from '../i18n'
import { useT } from '../i18n/context'
import type { AppData } from '../domain/types'
import { encodePlanShare, type SharePayload } from '../services/share'
import { ImportSharePanel } from './ImportSharePanel'
import { PlanEditor, type PlanEditorActions } from './PlanEditor'
import { ShareCodeBox } from './ShareCodeBox'

export interface PlansViewActions extends PlanEditorActions {
  createPlan: (name: string) => void
  removePlan: (planId: string) => void
  activatePlan: (planId: string | null) => void
  importShared: (payload: SharePayload) => string | undefined
}

interface Props {
  data: AppData
  actions: PlansViewActions
  /** Codice arrivato da un link #dati=…, da aprire subito in anteprima. */
  initialShareCode?: string | null
}

/** Le mie schede: elenco con scheda attiva, creazione, editor, condivisione e importazione. */
export function PlansView({ data, actions, initialShareCode }: Props) {
  const t = useT()
  const [newName, setNewName] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [sharingPlanId, setSharingPlanId] = useState<string | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)

  const editingPlan = data.plans.find((p) => p.id === editingPlanId) ?? null

  function handleCreate() {
    try {
      actions.createPlan(newName)
      setCreateError(null)
      setNewName('')
    } catch (err) {
      setCreateError(translateError(t, err))
    }
  }

  return (
    <>
      <Card component="section">
        <CardContent>
          <Typography variant="h2" gutterBottom>
            Le mie schede
          </Typography>
          <Stack
            direction="row"
            spacing={1.5}
            useFlexGap
            sx={{ flexWrap: 'wrap', alignItems: 'center', mb: 2 }}
          >
            <TextField
              label="Nuova scheda"
              placeholder="Es. Full Body 3x"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              slotProps={{ htmlInput: { 'data-cy': 'plan-name-input' } }}
            />
            <Button variant="contained" data-cy="plan-create" onClick={handleCreate}>
              Crea scheda
            </Button>
          </Stack>
          {createError && (
            <Alert severity="error" role="alert" data-cy="plan-create-error" sx={{ mb: 2 }}>
              {createError}
            </Alert>
          )}

          {data.plans.length === 0 ? (
            <Typography data-cy="plans-empty">
              Nessuna scheda: creane una o importane una condivisa.
            </Typography>
          ) : (
            <Box
              component="ul"
              data-cy="plan-list"
              sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 2 }}
            >
              {data.plans.map((plan) => {
                const isActive = data.activePlanId === plan.id
                const confirming = confirmingDeleteId === plan.id
                return (
                  <Card key={plan.id} component="li" variant="outlined" data-cy="plan-item">
                    <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        <Typography variant="h3" component="h3" data-cy="plan-name">
                          {plan.name}
                        </Typography>
                        {isActive && (
                          <Chip
                            size="small"
                            color="success"
                            variant="outlined"
                            data-cy="active-badge"
                            label="✓ attiva"
                          />
                        )}
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {plan.days.length === 0
                          ? 'Nessun giorno'
                          : plan.days.map((d) => d.name).join(' · ')}
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={0.5}
                        useFlexGap
                        sx={{ flexWrap: 'wrap', mt: 1.5 }}
                      >
                        {!isActive && (
                          <Button
                            size="small"
                            variant="contained"
                            data-cy="plan-activate"
                            onClick={() => actions.activatePlan(plan.id)}
                          >
                            Attiva
                          </Button>
                        )}
                        <Button
                          size="small"
                          color="inherit"
                          data-cy="plan-edit"
                          onClick={() => setEditingPlanId(plan.id)}
                        >
                          Modifica
                        </Button>
                        <Button
                          size="small"
                          color="inherit"
                          data-cy="plan-share"
                          onClick={() =>
                            setSharingPlanId(sharingPlanId === plan.id ? null : plan.id)
                          }
                        >
                          Condividi
                        </Button>
                        {confirming ? (
                          <>
                            <Button
                              size="small"
                              variant="contained"
                              color="error"
                              data-cy="plan-delete-confirm"
                              onClick={() => {
                                setConfirmingDeleteId(null)
                                if (editingPlanId === plan.id) setEditingPlanId(null)
                                actions.removePlan(plan.id)
                              }}
                            >
                              Conferma eliminazione
                            </Button>
                            <Button
                              size="small"
                              color="inherit"
                              data-cy="plan-delete-cancel"
                              onClick={() => setConfirmingDeleteId(null)}
                            >
                              Annulla
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="small"
                            color="inherit"
                            data-cy="plan-delete"
                            onClick={() => setConfirmingDeleteId(plan.id)}
                          >
                            Elimina
                          </Button>
                        )}
                      </Stack>
                      {sharingPlanId === plan.id && (
                        <Box sx={{ mt: 2 }}>
                          <ShareCodeBox code={encodePlanShare(data, plan.id)} />
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </Box>
          )}
        </CardContent>
      </Card>

      {editingPlan && (
        <PlanEditor
          plan={editingPlan}
          exercises={data.exercises}
          actions={actions}
          onClose={() => setEditingPlanId(null)}
        />
      )}

      <ImportSharePanel
        initialCode={initialShareCode}
        onImport={actions.importShared}
        onActivatePlan={(planId) => actions.activatePlan(planId)}
      />
    </>
  )
}
