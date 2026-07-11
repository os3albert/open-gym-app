import { useState } from 'react'
import { youtubeEmbedUrl, youtubeThumbnailUrl } from '../services/youtube'

interface Props {
  videoId: string
  title: string
}

/**
 * Facade lazy: mostra solo la miniatura e carica l'iframe (youtube-nocookie)
 * al primo click, così la lista non apre connessioni verso YouTube.
 */
export function YouTubePlayer({ videoId, title }: Props) {
  const [playing, setPlaying] = useState(false)
  const [thumbnailFailed, setThumbnailFailed] = useState(false)

  if (playing) {
    return (
      <div className="video-frame">
        <iframe
          data-cy="video-iframe"
          src={`${youtubeEmbedUrl(videoId)}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      className="video-facade"
      data-cy="video-facade"
      aria-label={`Riproduci il video di ${title}`}
      onClick={() => setPlaying(true)}
    >
      {thumbnailFailed ? (
        // L'app funziona offline, ma i video YouTube richiedono la rete (issue #25)
        <span className="video-offline" data-cy="video-offline">
          Video non disponibile senza connessione
        </span>
      ) : (
        <img
          src={youtubeThumbnailUrl(videoId)}
          alt={`Anteprima video di ${title}`}
          loading="lazy"
          onError={() => setThumbnailFailed(true)}
        />
      )}
      <span className="play-icon" aria-hidden="true">
        ▶
      </span>
    </button>
  )
}
