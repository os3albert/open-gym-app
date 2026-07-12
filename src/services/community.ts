import type { Exercise } from '../domain/types'
import type { CommunityExercise, CommunityVotes, ProposalInput } from './communityData'
import { voteCount } from './communityData'
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
  votes: CommunityVotes
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
    votes: (await votesRes.json()) as CommunityVotes,
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

export function sendCommunityVote(
  exerciseId: string,
  deviceHash: string,
  action: 'add' | 'remove',
  fetcher: typeof fetch = fetch,
): Promise<unknown> {
  return post('/votes', { exerciseId, deviceHash, action }, fetcher)
}

/** Hash SHA-256 dell'id dispositivo: nel repo finisce l'hash, mai l'id in chiaro. */
export async function hashDeviceId(deviceId: string): Promise<string> {
  const bytes = new TextEncoder().encode(deviceId)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
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
  votes: CommunityVotes,
): DisplayExercise[] {
  const localVideoIds = new Set(
    local.map((e) => parseYouTubeVideoId(e.youtubeUrl)).filter((id): id is string => id !== null),
  )
  const fromCommunity: DisplayExercise[] = community
    .filter((e) => {
      const videoId = parseYouTubeVideoId(e.youtubeUrl)
      return videoId === null || !localVideoIds.has(videoId)
    })
    .map((e) => ({ ...e, votes: voteCount(votes, e.id), fromCommunity: true }))

  return [...local, ...fromCommunity]
}
