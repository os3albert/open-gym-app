import { useState } from 'react'
import { useT } from '../i18n/context'
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
  const t = useT()
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
      aria-label={t('video.play', { title })}
      onClick={() => setPlaying(true)}
    >
      {thumbnailFailed ? (
        // L'app funziona offline, ma i video YouTube richiedono la rete (issue #25)
        <span className="video-offline" data-cy="video-offline">
          {t('video.offline')}
        </span>
      ) : (
        <img
          src={youtubeThumbnailUrl(videoId)}
          alt={t('video.thumbnailAlt', { title })}
          loading="lazy"
          onError={() => setThumbnailFailed(true)}
        />
      )}
      <span className="play-icon" aria-hidden="true">
        <span className="play-glyph">▶</span>
      </span>
    </button>
  )
}
