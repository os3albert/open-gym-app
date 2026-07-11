import { useState, type ChangeEvent } from 'react'
import { backupFileName, importFromJson } from '../services/importExport'
import { todayIso } from '../utils/date'

interface Props {
  onExport: () => string
  /** Ripristino completo (sostituisce tutto). Lancia se il JSON non è un backup valido. */
  onReplace: (json: string) => void
  /** Unione ai dati presenti senza duplicati. Lancia se il JSON non è un backup valido. */
  onMerge: (json: string) => void
}

export function BackupPanel({ onExport, onReplace, onMerge }: Props) {
  const [message, setMessage] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)
  /** Backup letto e validato, in attesa della scelta Sostituisci/Unisci. */
  const [pendingJson, setPendingJson] = useState<string | null>(null)

  function handleExport() {
    const blob = new Blob([onExport()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = backupFileName(todayIso())
    anchor.click()
    URL.revokeObjectURL(url)
    setIsError(false)
    setMessage('Backup esportato: controlla i download del dispositivo')
  }

  async function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const json = await file.text()
    try {
      // Si valida subito: un file non valido non arriva nemmeno alla scelta
      importFromJson(json)
      setPendingJson(json)
      setIsError(false)
      setMessage(null)
    } catch (error) {
      setPendingJson(null)
      setIsError(true)
      setMessage(error instanceof Error ? error.message : 'Import non riuscito')
    }
  }

  function applyImport(apply: (json: string) => void, successMessage: string) {
    if (!pendingJson) return
    try {
      apply(pendingJson)
      setIsError(false)
      setMessage(successMessage)
    } catch (error) {
      setIsError(true)
      setMessage(error instanceof Error ? error.message : 'Import non riuscito')
    } finally {
      setPendingJson(null)
    }
  }

  return (
    <section className="card">
      <h2>Backup dei dati</h2>
      <p className="hint">
        I dati vivono solo su questo dispositivo (localStorage): esporta un backup JSON per non
        perderli o importane uno esistente.
      </p>
      <div className="backup-actions">
        <button type="button" data-cy="export-button" onClick={handleExport}>
          Esporta backup JSON
        </button>
        <label className="import-label">
          Importa backup JSON
          <input
            type="file"
            accept=".json,application/json"
            data-cy="import-input"
            onChange={handleFileSelected}
          />
        </label>
      </div>

      {pendingJson && (
        <div className="import-choice" data-cy="import-choice">
          <p>Backup valido. Come lo importiamo?</p>
          <div className="card-actions">
            <button
              type="button"
              data-cy="import-replace"
              onClick={() => applyImport(onReplace, 'Backup importato correttamente')}
            >
              Sostituisci tutto
            </button>
            <button
              type="button"
              data-cy="import-merge"
              onClick={() => applyImport(onMerge, 'Backup unito ai dati presenti, senza duplicati')}
            >
              Unisci ai miei dati
            </button>
            <button
              type="button"
              className="btn-ghost"
              data-cy="import-cancel-backup"
              onClick={() => setPendingJson(null)}
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      {message && (
        <p role="status" data-cy="backup-message" className={isError ? 'error' : 'success'}>
          {message}
        </p>
      )}
    </section>
  )
}
