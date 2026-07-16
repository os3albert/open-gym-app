import { normalizeMuscleGroup } from '../domain/muscleGroups'
import type { Exercise } from '../domain/types'
import type { CommunityExercise, CommunityVotes, ProposalInput } from './communityData'
import { voteCounts } from './communityData'
import { parseYouTubeVideoId } from './youtube'

export const COMMUNITY_UNREACHABLE_ERROR = 'COMMUNITY_UNREACHABLE'

const REPO = 'os3albert/open-gym-app'
const BRANCH = 'main'
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/community`

/**
 * URL del worker; assente = community disattivata (l'app resta puramente locale).
 *
 * Deve essere un URL ASSOLUTO http(s): un valore senza schema (`open-gym-community…dev`)
 * finirebbe in `fetch` come percorso relativo, cioè su una rotta inesistente del sito.
 * Meglio community spenta che richieste che sembrano partire e invece prendono un 404.
 */
export function communityApiUrl(): string | null {
  const url = import.meta.env.VITE_COMMUNITY_API_URL
  if (typeof url !== 'string' || url === '') return null
  try {
    const { protocol } = new URL(url)
    if (protocol !== 'https:' && protocol !== 'http:') return null
  } catch {
    return null
  }
  return url.replace(/\/$/, '')
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
export type DisplayExercise = Exercise & { fromCommunity?: boolean; attribution?: string }

/**
 * Unisce catalogo community ed esercizi locali per la visualizzazione.
 *
 * Dedup sul video id (stessa regola della condivisione), e sullo stesso video **vince la voce
 * della community**: un esercizio che ho proposto io è pubblico, e sul mio dispositivo va
 * mostrato con l'id del catalogo. Se vincesse la mia copia locale (che ha un id diverso, generato
 * qui) il voto finirebbe nel reducer locale e non arriverebbe mai al worker — è esattamente il bug
 * per cui `votes.json` restava vuoto. Il conteggio mostrato è quello autorevole del repo.
 *
 * La copia locale NON viene cancellata: resta in AppData come riserva, così se la community è
 * irraggiungibile o disattivata l'esercizio riappare come mio e i backup restano completi.
 */
export function mergeForDisplay(
  local: Exercise[],
  community: CommunityExercise[],
  counts: Record<string, number>,
): DisplayExercise[] {
  const communityVideoIds = new Set(
    community
      .map((e) => parseYouTubeVideoId(e.youtubeUrl))
      .filter((id): id is string => id !== null),
  )
  // Le voci del catalogo senza video (M16) si riconoscono dalla GIF: senza questo dedup, la
  // copia locale creata da «Aggiungi alla scheda» apparirebbe in lista accanto all'originale.
  const communityGifUrls = new Set(
    community.map((e) => e.gifUrl).filter((url): url is string => Boolean(url)),
  )
  const onlyLocal = local.filter((e) => {
    const videoId = parseYouTubeVideoId(e.youtubeUrl)
    if (videoId !== null) return !communityVideoIds.has(videoId)
    return !e.gifUrl || !communityGifUrls.has(e.gifUrl)
  })
  const fromCommunity: DisplayExercise[] = community.map((e) => ({
    ...e,
    // Il catalogo pubblico ha voci col gruppo scritto a mano: si normalizza, non si scarta
    muscleGroup: normalizeMuscleGroup(e.muscleGroup),
    // Il catalogo pubblico ha voci proposte prima di M13, senza difficoltà: valgono «media»
    difficulty: e.difficulty ?? 'medium',
    votes: counts[e.id] ?? 0,
    fromCommunity: true,
  }))

  return [...onlyLocal, ...fromCommunity]
}
