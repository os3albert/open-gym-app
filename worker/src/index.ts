/**
 * Worker della community: unico pezzo di backend del progetto.
 * Riceve proposte e voti dall'app statica e li committa nel repo GitHub
 * (community/exercises.json, community/votes.json). La LETTURA del catalogo non
 * passa di qui: l'app scarica i file da raw.githubusercontent, così se il worker
 * è giù la community resta comunque consultabile.
 */
import {
  toggleCommunityVote,
  validateProposal,
  type CommunityExercise,
  type CommunityVotes,
} from '../../src/services/communityData'
import { updateJsonFile, type RepoConfig } from './github'

export interface Env {
  GITHUB_TOKEN: string
  REPO_OWNER: string
  REPO_NAME: string
  REPO_BRANCH: string
  /** Origini ammesse, separate da virgola (Pages + dev locale). */
  ALLOWED_ORIGINS: string
}

const EXERCISES_PATH = 'community/exercises.json'
const VOTES_PATH = 'community/votes.json'
const DEVICE_HASH_PATTERN = /^[a-f0-9]{64}$/

function corsHeaders(origin: string | null, env: Env): HeadersInit {
  const allowed = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  return {
    'Access-Control-Allow-Origin': origin && allowed.includes(origin) ? origin : allowed[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function json(body: unknown, status: number, cors: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

function repoConfig(env: Env): RepoConfig {
  return {
    owner: env.REPO_OWNER,
    repo: env.REPO_NAME,
    branch: env.REPO_BRANCH,
    token: env.GITHUB_TOKEN,
  }
}

async function handleProposal(request: Request, env: Env, cors: HeadersInit): Promise<Response> {
  const input = (await request.json()) as Parameters<typeof validateProposal>[0]
  let created: CommunityExercise | null = null

  await updateJsonFile<CommunityExercise[]>(repoConfig(env), EXERCISES_PATH, (catalog) => {
    // La validazione sta DENTRO l'update: solo così il dedup vede il catalogo aggiornato al retry
    created = validateProposal(input, catalog)
    return {
      next: [...catalog, created],
      message: `community: nuovo esercizio «${created.name}»`,
    }
  })

  return json({ exercise: created }, 201, cors)
}

async function handleVote(request: Request, env: Env, cors: HeadersInit): Promise<Response> {
  const { exerciseId, deviceHash, action } = (await request.json()) as {
    exerciseId?: string
    deviceHash?: string
    action?: 'add' | 'remove'
  }
  if (!exerciseId || !DEVICE_HASH_PATTERN.test(deviceHash ?? '')) {
    return json({ error: 'Richiesta di voto non valida' }, 400, cors)
  }
  if (action !== 'add' && action !== 'remove') {
    return json({ error: 'Richiesta di voto non valida' }, 400, cors)
  }

  const config = repoConfig(env)
  const catalog = await fetchCatalog(config)
  let count = 0

  await updateJsonFile<CommunityVotes>(config, VOTES_PATH, (votes) => {
    const next = toggleCommunityVote(votes, exerciseId, deviceHash!, action, catalog)
    count = next[exerciseId].length
    return {
      next,
      message: `community: ${action === 'add' ? 'voto' : 'voto rimosso'} su ${exerciseId}`,
    }
  })

  return json({ exerciseId, votes: count }, 200, cors)
}

/** Il catalogo serve solo per validare l'id votato: si legge dal raw, senza consumare rate limit dell'API. */
async function fetchCatalog(config: RepoConfig): Promise<CommunityExercise[]> {
  const url = `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/${EXERCISES_PATH}`
  const response = await fetch(url, { headers: { 'User-Agent': 'open-gym-community-worker' } })
  if (!response.ok) throw new Error('Catalogo della community non raggiungibile')
  return (await response.json()) as CommunityExercise[]
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(request.headers.get('Origin'), env)
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
    if (request.method !== 'POST') return json({ error: 'Metodo non ammesso' }, 405, cors)

    const { pathname } = new URL(request.url)
    try {
      if (pathname === '/exercises') return await handleProposal(request, env, cors)
      if (pathname === '/votes') return await handleVote(request, env, cors)
      return json({ error: 'Endpoint non trovato' }, 404, cors)
    } catch (error) {
      // I messaggi di validazione sono contratto: arrivano all'utente così come sono
      const message = error instanceof Error ? error.message : 'Richiesta non riuscita'
      return json({ error: message }, 400, cors)
    }
  },
}
