import { useState } from 'react'
import type { Exercise } from '../domain/types'
import { useT } from '../i18n/context'
import { parseYouTubeVideoId } from '../services/youtube'
import { YouTubePlayer } from './YouTubePlayer'

/**
 * L'attribuzione del media del catalogo. Mostrarla accanto a OGNI GIF è un obbligo della
 * licenza Gym visual, non una cortesia: se manca nel dato, vale questa.
 */
const GYM_VISUAL_ATTRIBUTION = '© Gym visual — https://gymvisual.com/'
const GYM_VISUAL_URL = 'https://gymvisual.com/'

interface Props {
  exercise: Pick<Exercise, 'name' | 'youtubeUrl' | 'gifUrl'> & { attribution?: string }
}

/**
 * Il media di un esercizio (M16): il video YouTube quando c'è, altrimenti la GIF animata del
 * catalogo. La GIF è distribuita a 180×180 e si mostra a quella taglia, MAI ingrandita: è un
 * vincolo di licenza oltre che di decenza visiva.
 */
export function ExerciseMedia({ exercise }: Props) {
  const t = useT()
  const [gifFailed, setGifFailed] = useState(false)

  const videoId = parseYouTubeVideoId(exercise.youtubeUrl)
  if (videoId) return <YouTubePlayer videoId={videoId} title={exercise.name} />
  if (!exercise.gifUrl) return null

  const attribution = exercise.attribution ?? GYM_VISUAL_ATTRIBUTION
  return (
    <figure className="gif-media" data-cy="gif-media">
      {gifFailed ? (
        // Come i video: l'app funziona offline, il media del catalogo richiede la rete
        <span className="video-offline" data-cy="gif-offline">
          {t('video.offline')}
        </span>
      ) : (
        <img
          src={exercise.gifUrl}
          alt={t('video.gifAlt', { title: exercise.name })}
          loading="lazy"
          width={180}
          height={180}
          onError={() => setGifFailed(true)}
        />
      )}
      <figcaption className="gif-attribution">
        <a href={GYM_VISUAL_URL} target="_blank" rel="noreferrer" title={attribution}>
          {attribution}
        </a>
      </figcaption>
    </figure>
  )
}
