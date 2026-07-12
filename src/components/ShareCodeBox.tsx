import { useState } from 'react'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { SHARE_HASH_PREFIX } from '../services/share'

interface Props {
  code: string
}

/**
 * Mostra un codice di condivisione pronto da inviare: il campo è sempre visibile
 * (fallback universale), la copia negli appunti e la Web Share API sono comodità in più.
 */
export function ShareCodeBox({ code }: Props) {
  const [feedback, setFeedback] = useState<string | null>(null)
  const link = `${window.location.origin}${window.location.pathname}${SHARE_HASH_PREFIX}${code}`

  async function copy(text: string, message: string) {
    try {
      await navigator.clipboard.writeText(text)
      setFeedback(message)
    } catch {
      // Appunti non disponibili (permessi/contesto): si copia a mano dal campo
      setFeedback(null)
    }
  }

  return (
    <Stack spacing={1} className="share-box" data-cy="share-box">
      <TextField
        multiline
        rows={3}
        value={code}
        onFocus={(e) => (e.target as HTMLTextAreaElement).select?.()}
        slotProps={{
          htmlInput: {
            readOnly: true,
            'data-cy': 'share-code',
            'aria-label': 'Codice di condivisione',
            sx: { fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all' },
          },
        }}
      />
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <Button
          size="small"
          variant="outlined"
          data-cy="share-copy"
          onClick={() => copy(code, 'Codice copiato negli appunti!')}
        >
          Copia codice
        </Button>
        <Button
          size="small"
          variant="outlined"
          data-cy="share-copy-link"
          onClick={() => copy(link, 'Link copiato negli appunti!')}
        >
          Copia link
        </Button>
        {typeof navigator.share === 'function' && (
          <Button
            size="small"
            variant="outlined"
            data-cy="share-native"
            onClick={() => navigator.share({ text: link }).catch(() => {})}
          >
            Condividi…
          </Button>
        )}
      </Stack>
      {feedback && (
        <Typography variant="body2" sx={{ color: 'success.main' }} data-cy="share-copied">
          {feedback}
        </Typography>
      )}
    </Stack>
  )
}
