import { useState } from 'react'
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
      setCreateError(err instanceof Error ? err.message : 'Nome non valido')
    }
  }

  return (
    <>
      <section className="card">
        <h2>Le mie schede</h2>
        <div className="plan-create">
          <label>
            Nuova scheda
            <input
              data-cy="plan-name-input"
              placeholder="Es. Full Body 3x"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </label>
          <button type="button" data-cy="plan-create" onClick={handleCreate}>
            Crea scheda
          </button>
        </div>
        {createError && (
          <p role="alert" data-cy="plan-create-error" className="error">
            {createError}
          </p>
        )}

        {data.plans.length === 0 ? (
          <p data-cy="plans-empty">Nessuna scheda: creane una o importane una condivisa.</p>
        ) : (
          <ul className="plan-list" data-cy="plan-list">
            {data.plans.map((plan) => {
              const isActive = data.activePlanId === plan.id
              const confirming = confirmingDeleteId === plan.id
              return (
                <li key={plan.id} className="plan-item" data-cy="plan-item">
                  <div className="plan-item-header">
                    <h3 data-cy="plan-name">{plan.name}</h3>
                    {isActive && (
                      <span className="badge badge-ok" data-cy="active-badge">
                        ✓ attiva
                      </span>
                    )}
                  </div>
                  <p className="hint">
                    {plan.days.length === 0
                      ? 'Nessun giorno'
                      : plan.days.map((d) => d.name).join(' · ')}
                  </p>
                  <div className="card-actions">
                    {!isActive && (
                      <button
                        type="button"
                        data-cy="plan-activate"
                        onClick={() => actions.activatePlan(plan.id)}
                      >
                        Attiva
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-ghost"
                      data-cy="plan-edit"
                      onClick={() => setEditingPlanId(plan.id)}
                    >
                      Modifica
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      data-cy="plan-share"
                      onClick={() => setSharingPlanId(sharingPlanId === plan.id ? null : plan.id)}
                    >
                      Condividi
                    </button>
                    {confirming ? (
                      <>
                        <button
                          type="button"
                          className="btn-danger"
                          data-cy="plan-delete-confirm"
                          onClick={() => {
                            setConfirmingDeleteId(null)
                            if (editingPlanId === plan.id) setEditingPlanId(null)
                            actions.removePlan(plan.id)
                          }}
                        >
                          Conferma eliminazione
                        </button>
                        <button
                          type="button"
                          className="btn-ghost"
                          data-cy="plan-delete-cancel"
                          onClick={() => setConfirmingDeleteId(null)}
                        >
                          Annulla
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="btn-ghost"
                        data-cy="plan-delete"
                        onClick={() => setConfirmingDeleteId(plan.id)}
                      >
                        Elimina
                      </button>
                    )}
                  </div>
                  {sharingPlanId === plan.id && (
                    <ShareCodeBox code={encodePlanShare(data, plan.id)} />
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

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
