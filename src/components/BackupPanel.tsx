import { useState, type ChangeEvent } from 'react'

interface Props {
  onExport: () => string
  /** Lancia un errore se il JSON non è un backup valido. */
  onImport: (json: string) => void
}

export const BACKUP_FILE_NAME = 'open-gym-backup.json'

export function BackupPanel({ onExport, onImport }: Props) {
  const [message, setMessage] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)

  function handleExport() {
    const blob = new Blob([onExport()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = BACKUP_FILE_NAME
    anchor.click()
    URL.revokeObjectURL(url)
    setIsError(false)
    setMessage('Backup esportato: controlla i download del dispositivo')
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      onImport(await file.text())
      setIsError(false)
      setMessage('Backup importato correttamente')
    } catch (error) {
      setIsError(true)
      setMessage(error instanceof Error ? error.message : 'Import non riuscito')
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
            onChange={handleImport}
          />
        </label>
      </div>
      {message && (
        <p role="status" data-cy="backup-message" className={isError ? 'error' : 'success'}>
          {message}
        </p>
      )}
    </section>
  )
}
