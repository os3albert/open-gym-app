import { useState, type ChangeEvent } from 'react'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
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
    <Card component="section">
      <CardContent>
        <Typography variant="h2" gutterBottom>
          Backup dei dati
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          I dati vivono solo su questo dispositivo (localStorage): esporta un backup JSON per non
          perderli o importane uno esistente.
        </Typography>
        <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadOutlinedIcon />}
            data-cy="export-button"
            onClick={handleExport}
          >
            Esporta backup JSON
          </Button>
          <Button variant="outlined" component="label" startIcon={<FileUploadOutlinedIcon />}>
            Importa backup JSON
            <Box
              component="input"
              type="file"
              accept=".json,application/json"
              data-cy="import-input"
              onChange={handleFileSelected}
              sx={{
                clip: 'rect(0 0 0 0)',
                position: 'absolute',
                width: 1,
                height: 1,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            />
          </Button>
        </Stack>

        {pendingJson && (
          <Box
            data-cy="import-choice"
            sx={{ border: 1, borderColor: 'divider', borderRadius: 3, p: 2, mt: 2 }}
          >
            <Typography sx={{ mb: 1.5 }}>Backup valido. Come lo importiamo?</Typography>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                data-cy="import-replace"
                onClick={() => applyImport(onReplace, 'Backup importato correttamente')}
              >
                Sostituisci tutto
              </Button>
              <Button
                variant="outlined"
                data-cy="import-merge"
                onClick={() =>
                  applyImport(onMerge, 'Backup unito ai dati presenti, senza duplicati')
                }
              >
                Unisci ai miei dati
              </Button>
              <Button
                color="inherit"
                data-cy="import-cancel-backup"
                onClick={() => setPendingJson(null)}
              >
                Annulla
              </Button>
            </Stack>
          </Box>
        )}

        {message && (
          <Typography
            variant="body2"
            role="status"
            data-cy="backup-message"
            sx={{ mt: 2, color: isError ? 'error.main' : 'success.main' }}
          >
            {message}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}
