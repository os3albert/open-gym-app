/**
 * Lettura/scrittura di un file JSON del repo tramite GitHub Contents API.
 * La scrittura è ottimistica: si legge lo SHA, si scrive, e se un'altra richiesta
 * ha committato nel frattempo (409/412) si riprova da capo con lo SHA aggiornato.
 */

export interface RepoConfig {
  owner: string
  repo: string
  branch: string
  token: string
}

interface FileState<T> {
  content: T
  sha: string
}

const API = 'https://api.github.com'

function headers(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'open-gym-community-worker',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

/**
 * Contenuto di un file JSON del repo, letto dall'API autenticata: è SEMPRE aggiornato.
 * (`raw.githubusercontent` è una CDN con qualche minuto di cache: per validare un voto su un
 * esercizio appena proposto mostrerebbe un catalogo vecchio e lo rifiuterebbe come inesistente.)
 */
export async function readJsonFile<T>(config: RepoConfig, path: string): Promise<T> {
  return (await readFile<T>(config, path)).content
}

async function readFile<T>(config: RepoConfig, path: string): Promise<FileState<T>> {
  const url = `${API}/repos/${config.owner}/${config.repo}/contents/${path}?ref=${config.branch}`
  const response = await fetch(url, { headers: headers(config.token) })
  if (!response.ok) {
    throw new Error(`Lettura di ${path} non riuscita (${response.status})`)
  }
  const payload = (await response.json()) as { content: string; sha: string }
  // L'API restituisce base64 con a capo ogni 60 caratteri
  const decoded = atob(payload.content.replace(/\n/g, ''))
  const json = new TextDecoder().decode(Uint8Array.from(decoded, (c) => c.charCodeAt(0)))
  return { content: JSON.parse(json) as T, sha: payload.sha }
}

async function writeFile(
  config: RepoConfig,
  path: string,
  content: unknown,
  sha: string,
  message: string,
): Promise<Response> {
  const json = `${JSON.stringify(content, null, 2)}\n`
  const bytes = new TextEncoder().encode(json)
  const base64 = btoa(String.fromCharCode(...bytes))
  return fetch(`${API}/repos/${config.owner}/${config.repo}/contents/${path}`, {
    method: 'PUT',
    headers: { ...headers(config.token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: base64, sha, branch: config.branch }),
  })
}

/**
 * Legge il file, applica la modifica e committa. Su conflitto di concorrenza ritenta
 * (fino a `attempts` volte) rileggendo lo stato aggiornato: due utenti che propongono
 * o votano nello stesso istante non si cancellano a vicenda.
 */
export async function updateJsonFile<T>(
  config: RepoConfig,
  path: string,
  update: (current: T) => { next: T; message: string },
  attempts = 3,
): Promise<T> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const { content, sha } = await readFile<T>(config, path)
    const { next, message } = update(content)
    const response = await writeFile(config, path, next, sha, message)
    if (response.ok) return next
    // 409 (sha obsoleto) e 422 (conflitto) sono ritentabili: si rilegge e si riapplica
    if (response.status !== 409 && response.status !== 422) {
      throw new Error(`Commit di ${path} non riuscito (${response.status})`)
    }
  }
  throw new Error(`Commit di ${path} non riuscito dopo ${attempts} tentativi (troppa concorrenza)`)
}
