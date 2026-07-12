/**
 * Worker della community: unico pezzo di backend del progetto.
 * Riceve proposte e voti dall'app statica e li committa nel repo GitHub
 * (community/exercises.json, community/votes.json). La LETTURA del catalogo non
 * passa di qui: l'app scarica i file da raw.githubusercontent, così se il worker
 * è giù la community resta comunque consultabile.
 *
 * Sicurezza (M10):
 * - l'origine è verificata QUI, non solo negli header CORS (il CORS è una difesa del
 *   browser: una richiesta con curl lo ignora);
 * - l'identità del votante è derivata dal worker (hash di IP + salt segreto): fidarsi
 *   di un identificatore inviato dal client renderebbe i voti gonfiabili all'infinito;
 * - il corpo della richiesta ha un tetto di dimensione, e i campi hanno limiti di lunghezza
 *   (il catalogo è un file del repo: una proposta non deve poterci scrivere megabyte);
 * - se il binding KV è configurato, ogni IP ha un limite di scritture all'ora.
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
  /** Salt segreto per l'hash del votante: senza, l'hash sarebbe ricostruibile da un IP noto. */
  VOTE_SALT: string
  REPO_OWNER: string
  REPO_NAME: string
  REPO_BRANCH: string
  /** Origini ammesse, separate da virgola (Pages + dev locale). */
  ALLOWED_ORIGINS: string
  /** Opzionale: se presente, limita le scritture per IP (vedi RATE_LIMIT_PER_HOUR). */
  RATE_LIMIT?: KVNamespace
}

const EXERCISES_PATH = 'community/exercises.json'
const VOTES_PATH = 'community/votes.json'
const MAX_BODY_BYTES = 4096
const RATE_LIMIT_PER_HOUR = 20

function allowedOrigins(env: Env): string[] {
  return env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
}

function corsHeaders(origin: string | null, env: Env): HeadersInit {
  const allowed = allowedOrigins(env)
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

/** Legge il corpo con un tetto di dimensione: un JSON enorme non deve nemmeno essere parsato. */
async function readBody(request: Request): Promise<unknown> {
  const declared = Number(request.headers.get('Content-Length') ?? '0')
  if (declared > MAX_BODY_BYTES) throw new Error('Richiesta troppo grande')
  const text = await request.text()
  if (text.length > MAX_BODY_BYTES) throw new Error('Richiesta troppo grande')
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('Richiesta non valida')
  }
}

/**
 * Identità del votante: hash di (salt segreto + IP). Non è reversibile e nel repo non
 * finisce alcun dato personale; vale «un voto per rete», che è il compromesso onesto
 * senza account (chi sta dietro lo stesso NAT condivide il voto).
 */
async function voterHash(request: Request, env: Env): Promise<string> {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'sconosciuto'
  const bytes = new TextEncoder().encode(`${env.VOTE_SALT}:${ip}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Limite di scritture per IP (solo se il binding KV è configurato). */
async function rateLimited(env: Env, hash: string): Promise<boolean> {
  if (!env.RATE_LIMIT) return false
  const key = `rl:${hash}:${new Date().toISOString().slice(0, 13)}` // finestra oraria
  const count = Number((await env.RATE_LIMIT.get(key)) ?? '0')
  if (count >= RATE_LIMIT_PER_HOUR) return true
  await env.RATE_LIMIT.put(key, String(count + 1), { expirationTtl: 3600 })
  return false
}

async function handleProposal(request: Request, env: Env, cors: HeadersInit): Promise<Response> {
  const input = (await readBody(request)) as Parameters<typeof validateProposal>[0]
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

async function handleVote(
  request: Request,
  env: Env,
  cors: HeadersInit,
  hash: string,
): Promise<Response> {
  const { exerciseId, action } = (await readBody(request)) as {
    exerciseId?: string
    action?: 'add' | 'remove'
  }
  if (typeof exerciseId !== 'string' || (action !== 'add' && action !== 'remove')) {
    return json({ error: 'Richiesta di voto non valida' }, 400, cors)
  }

  const config = repoConfig(env)
  const catalog = await fetchCatalog(config)
  let count = 0

  await updateJsonFile<CommunityVotes>(config, VOTES_PATH, (votes) => {
    const next = toggleCommunityVote(votes, exerciseId, hash, action, catalog)
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
  const response = await fetch(url, { headers: { 'User-Agent': 'open-gym-app-worker' } })
  if (!response.ok) throw new Error('Catalogo della community non raggiungibile')
  return (await response.json()) as CommunityExercise[]
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin')
    const cors = corsHeaders(origin, env)
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
    if (request.method !== 'POST') return json({ error: 'Metodo non ammesso' }, 405, cors)

    // Il CORS non ferma curl: l'origine si verifica qui, e senza origine non si scrive
    if (origin === null || !allowedOrigins(env).includes(origin)) {
      return json({ error: 'Origine non ammessa' }, 403, cors)
    }

    const hash = await voterHash(request, env)
    if (await rateLimited(env, hash)) {
      return json({ error: 'Troppe richieste: riprova più tardi' }, 429, cors)
    }

    const { pathname } = new URL(request.url)
    try {
      if (pathname === '/exercises') return await handleProposal(request, env, cors)
      if (pathname === '/votes') return await handleVote(request, env, cors, hash)
      return json({ error: 'Endpoint non trovato' }, 404, cors)
    } catch (error) {
      // I messaggi di validazione sono contratto: arrivano all'utente così come sono
      const message = error instanceof Error ? error.message : 'Richiesta non riuscita'
      return json({ error: message }, 400, cors)
    }
  },
}
