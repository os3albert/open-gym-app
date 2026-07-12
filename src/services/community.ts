import type { Exercise } from '../domain/types'
import type { CommunityExercise, CommunityVotes, ProposalInput } from './communityData'
import { voteCounts } from './communityData'
import { parseYouTubeVideoId } from './youtube'

export const COMMUNITY_UNREACHABLE_ERROR = 'Community non raggiungibile: riprova più tardi'

const REPO = 'os3albert/open-gym-app'
const BRANCH = 'main'
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/community`

/** URL del worker; assente = community disattivata (l'app resta puramente locale). */
export function communityApiUrl(): string | null {
  const url = import.meta.env.VITE_COMMUNITY_API_URL
  return typeof url === 'string' && url !== '' ? url.replace(/\/$/, '') : null
}

export interface CommunitySnapshot {
  exercises: CommunityExercise[]
  /** Solo i conteggi: gli hash dei votanti restano nel repo, l'app non li usa. */
  counts: Record<string, number>
}

/**
 * Catalogo e voti si leggono dai file grezzi del repo, MAI dal worker: se il worker è
 * spento (o non configurato) la community resta comunque consultabile.
 */
export async function fetchCommunity(fetcher: typeof fetch = fetch): Promise<CommunitySnapshot> {
  const [exercisesRes, votesRes] = await Promise.all([
    fetcher(`${RAW_BASE}/exercises.json`, { cache: 'no-cache' }),
    fetcher(`${RAW_BASE}/votes.json`, { cache: 'no-cache' }),
  ])
  if (!exercisesRes.ok || !votesRes.ok) throw new Error(COMMUNITY_UNREACHABLE_ERROR)
  return {
    exercises: (await exercisesRes.json()) as CommunityExercise[],
    counts: voteCounts((await votesRes.json()) as CommunityVotes),
  }
}

async function post(path: string, body: unknown, fetcher: typeof fetch): Promise<unknown> {
  const base = communityApiUrl()
  if (base === null) throw new Error(COMMUNITY_UNREACHABLE_ERROR)
  let response: Response
  try {
    response = await fetcher(`${base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error(COMMUNITY_UNREACHABLE_ERROR)
  }
  const payload = (await response.json().catch(() => null)) as { error?: string } | null
  if (!response.ok) {
    // I messaggi di validazione del worker sono gli stessi del dominio: si mostrano così come sono
    throw new Error(payload?.error ?? COMMUNITY_UNREACHABLE_ERROR)
  }
  return payload
}

export function proposeToCommunity(
  input: ProposalInput,
  fetcher: typeof fetch = fetch,
): Promise<unknown> {
  return post('/exercises', input, fetcher)
}

/**
 * Il votante NON si identifica da sé: l'identità la deriva il worker (hash di IP + salt).
 * Un identificatore scelto dal client sarebbe falsificabile e i voti gonfiabili con curl.
 * Qui si dice solo COSA si vota; il conteggio autorevole torna nella risposta.
 */
export async function sendCommunityVote(
  exerciseId: string,
  action: 'add' | 'remove',
  fetcher: typeof fetch = fetch,
): Promise<number | null> {
  const payload = (await post('/votes', { exerciseId, action }, fetcher)) as {
    votes?: number
  } | null
  return typeof payload?.votes === 'number' ? payload.votes : null
}

/** Un esercizio mostrato in lista: quelli della community non si modificano né si eliminano. */
export type DisplayExercise = Exercise & { fromCommunity?: boolean }

/**
 * Unisce catalogo community ed esercizi locali per la visualizzazione.
 * Dedup sul video id (stessa regola della condivisione): se ho già l'esercizio in locale
 * vince la mia copia, così restano modificabili le cose che ho proposto io.
 */
export function mergeForDisplay(
  local: Exercise[],
  community: CommunityExercise[],
  counts: Record<string, number>,
): DisplayExercise[] {
  const localVideoIds = new Set(
    local.map((e) => parseYouTubeVideoId(e.youtubeUrl)).filter((id): id is string => id !== null),
  )
  const fromCommunity: DisplayExercise[] = community
    .filter((e) => {
      const videoId = parseYouTubeVideoId(e.youtubeUrl)
      return videoId === null || !localVideoIds.has(videoId)
    })
    .map((e) => ({ ...e, votes: counts[e.id] ?? 0, fromCommunity: true }))

  return [...local, ...fromCommunity]
}
