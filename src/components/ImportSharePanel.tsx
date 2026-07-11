import { useState } from 'react'
import { decodeShare, type SharePayload } from '../services/share'

interface Props {
  /** Codice arrivato da un link #dati=…: precompila e mostra subito l'anteprima. */
  initialCode?: string | null
  /** Applica il pacchetto ai dati; se era una scheda ritorna l'id importato. */
  onImport: (payload: SharePayload) => string | undefined
  onActivatePlan: (planId: string) => void
}

/** Importazione di un codice condiviso: anteprima, conferma, «Prova questa scheda». */
export function ImportSharePanel({ initialCode, onImport, onActivatePlan }: Props) {
  const [code, setCode] = useState(initialCode ?? '')
  const [preview, setPreview] = useState<SharePayload | null>(() => {
    if (!initialCode) return null
    try {
      return decodeShare(initialCode)
    } catch {
      return null
    }
  })
  const [error, setError] = useState<string | null>(null)
  const [importedPlanId, setImportedPlanId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  function handlePreview() {
    try {
      setPreview(decodeShare(code))
      setError(null)
      setMessage(null)
      setImportedPlanId(null)
    } catch (err) {
      setPreview(null)
      setError(err instanceof Error ? err.message : 'Codice non valido')
    }
  }

  function handleConfirm() {
    if (!preview) return
    const planId = onImport(preview)
    setImportedPlanId(planId ?? null)
    setMessage(
      preview.kind === 'plan'
        ? 'Scheda aggiunta alle tue!'
        : 'Esercizio aggiunto ai tuoi (se non lo avevi già).',
    )
    setPreview(null)
    setCode('')
  }

  function handleCancel() {
    setPreview(null)
    setError(null)
    setMessage(null)
    setCode('')
  }

  return (
    <section className="card" data-cy="import-panel">
      <h2>Importa da un altro utente</h2>
      <p className="hint">
        Incolla il codice di condivisione ricevuto: vedrai un'anteprima prima di aggiungere.
      </p>
      <label>
        Codice ricevuto
        <textarea
          rows={3}
          data-cy="import-code-input"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </label>
      <div className="card-actions">
        <button
          type="button"
          data-cy="import-preview-btn"
          disabled={!code.trim()}
          onClick={handlePreview}
        >
          Anteprima
        </button>
      </div>

      {error && (
        <p role="alert" data-cy="import-error" className="error">
          {error}
        </p>
      )}

      {preview && (
        <div className="import-preview" data-cy="import-preview">
          {preview.kind === 'exercise' ? (
            <>
              <h3>Esercizio: {preview.exercise.name}</h3>
              <p className="badges">
                {preview.exercise.muscleGroup && (
                  <span className="badge">{preview.exercise.muscleGroup}</span>
                )}
                {preview.exercise.stature && (
                  <span className="badge">
                    {preview.exercise.stature.minCm}–{preview.exercise.stature.maxCm} cm
                  </span>
                )}
              </p>
            </>
          ) : (
            <>
              <h3>Scheda: {preview.plan.name}</h3>
              {preview.plan.days.map((day) => (
                <div key={day.name} data-cy="import-preview-day">
                  <strong>{day.name}</strong>
                  <ul>
                    {day.entries.map((entry, i) => (
                      <li key={i}>
                        {entry.exercise.name} — {entry.sets}×{entry.reps}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </>
          )}
          <div className="card-actions">
            <button type="button" data-cy="import-confirm" onClick={handleConfirm}>
              Aggiungi ai miei
            </button>
            <button
              type="button"
              className="btn-ghost"
              data-cy="import-cancel"
              onClick={handleCancel}
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      {message && (
        <p className="success" data-cy="import-success">
          {message}
        </p>
      )}
      {importedPlanId && (
        <button
          type="button"
          data-cy="try-imported-plan"
          onClick={() => {
            onActivatePlan(importedPlanId)
            setImportedPlanId(null)
            setMessage('Fatta! Ora è la tua scheda attiva.')
          }}
        >
          Prova questa scheda
        </button>
      )}
    </section>
  )
}
