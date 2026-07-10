const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/

/**
 * Estrae l'id video da un link YouTube (watch, youtu.be, shorts, embed, live).
 * Ritorna null se il link non è un video YouTube valido.
 */
export function parseYouTubeVideoId(url: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(url.trim())
  } catch {
    return null
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null

  const host = parsed.hostname.replace(/^www\./, '')
  const segments = parsed.pathname.split('/').filter(Boolean)

  let candidate: string | null = null
  if (host === 'youtu.be') {
    candidate = segments[0] ?? null
  } else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
    if (segments[0] === 'watch') {
      candidate = parsed.searchParams.get('v')
    } else if (['shorts', 'embed', 'live'].includes(segments[0] ?? '')) {
      candidate = segments[1] ?? null
    }
  }

  return candidate !== null && VIDEO_ID_PATTERN.test(candidate) ? candidate : null
}

export function isValidYouTubeUrl(url: string): boolean {
  return parseYouTubeVideoId(url) !== null
}

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`
}

/** Player incorporato rispettoso della privacy (nessun cookie finché non si avvia il video). */
export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}`
}

export function youtubeThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}
