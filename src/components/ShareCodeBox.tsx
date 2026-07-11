import { useState } from 'react'
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
    <div className="share-box" data-cy="share-box">
      <textarea
        readOnly
        rows={3}
        data-cy="share-code"
        aria-label="Codice di condivisione"
        value={code}
        onFocus={(e) => e.currentTarget.select()}
      />
      <div className="card-actions">
        <button
          type="button"
          className="btn-ghost btn-small"
          data-cy="share-copy"
          onClick={() => copy(code, 'Codice copiato negli appunti!')}
        >
          Copia codice
        </button>
        <button
          type="button"
          className="btn-ghost btn-small"
          data-cy="share-copy-link"
          onClick={() => copy(link, 'Link copiato negli appunti!')}
        >
          Copia link
        </button>
        {typeof navigator.share === 'function' && (
          <button
            type="button"
            className="btn-ghost btn-small"
            data-cy="share-native"
            onClick={() => navigator.share({ text: link }).catch(() => {})}
          >
            Condividi…
          </button>
        )}
      </div>
      {feedback && (
        <p className="success" data-cy="share-copied">
          {feedback}
        </p>
      )}
    </div>
  )
}
