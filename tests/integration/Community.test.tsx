// Integrazione della community (M8): catalogo condiviso, proposta e voto verso il worker.
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../src/App'
import type { CommunityExercise } from '../../src/services/communityData'

const WORKER = 'https://worker.example'

const catalog: CommunityExercise[] = [
  {
    id: 'ex-community',
    name: 'Military press',
    description: 'Spinta sopra la testa',
    youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
    muscleGroup: 'Spalle',
    faceBlurConfirmed: true,
    createdAt: '2026-07-01T10:00:00.000Z',
  },
]

/** Risposte del repo (catalogo e voti) e del worker; le chiamate al worker si registrano. */
function stubNetwork(options: { votes?: Record<string, string[]>; workerFails?: boolean } = {}) {
  const calls: Array<{ url: string; body: unknown }> = []
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if (url.endsWith('/exercises.json')) return Response.json(catalog)
    if (url.endsWith('/votes.json')) return Response.json(options.votes ?? {})
    if (url.startsWith(WORKER)) {
      calls.push({ url, body: JSON.parse(String(init?.body)) })
      if (options.workerFails) return Response.json({ error: 'Community offline' }, { status: 503 })
      return Response.json({ ok: true }, { status: 201 })
    }
    throw new Error(`URL non previsto nel test: ${url}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  return calls
}

beforeEach(() => {
  localStorage.clear()
  window.history.replaceState(null, '', '/')
  vi.stubEnv('VITE_COMMUNITY_API_URL', WORKER)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('catalogo della community', () => {
  it('mostra gli esercizi condivisi con il badge e i voti dal repo', async () => {
    stubNetwork({ votes: { 'ex-community': ['hash-a', 'hash-b'] } })
    render(<App />)

    const heading = await screen.findByRole('heading', { name: 'Military press' })
    const item = heading.closest('li')!
    expect(within(item).getByText('community')).toBeInTheDocument()
    expect(within(item).getByText('2')).toBeInTheDocument()
    // Non è mio: non lo posso modificare né eliminare
    expect(within(item).queryByRole('button', { name: 'Modifica' })).not.toBeInTheDocument()
    expect(within(item).queryByRole('button', { name: 'Elimina' })).not.toBeInTheDocument()
  })

  it('votare un esercizio condiviso aggiorna il conteggio e invia il voto al worker', async () => {
    const calls = stubNetwork()
    const user = userEvent.setup()
    render(<App />)
    const item = (await screen.findByRole('heading', { name: 'Military press' })).closest('li')!

    await user.click(within(item).getByRole('button', { name: 'Vota Military press' }))

    await waitFor(() => expect(within(item).getByText('1')).toBeInTheDocument())
    const vote = calls.find((c) => c.url.endsWith('/votes'))!
    expect(vote.body).toMatchObject({ exerciseId: 'ex-community', action: 'add' })
    // Nel repo finisce solo l'hash del dispositivo, mai l'id in chiaro
    expect((vote.body as { deviceHash: string }).deviceHash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('se il worker rifiuta il voto, il conteggio torna indietro con un messaggio', async () => {
    stubNetwork({ workerFails: true })
    const user = userEvent.setup()
    render(<App />)
    const item = (await screen.findByRole('heading', { name: 'Military press' })).closest('li')!

    await user.click(within(item).getByRole('button', { name: 'Vota Military press' }))

    expect(await screen.findByText('Community offline')).toBeInTheDocument()
    expect(within(item).getByText('0')).toBeInTheDocument()
  })
})

describe('proposta alla community', () => {
  async function proponi(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: 'Nuova proposta' }))
    await user.type(screen.getByLabelText('Nome esercizio'), 'Squat frontale')
    await user.type(
      screen.getByLabelText('Link YouTube (volto offuscato)'),
      'https://youtu.be/AAAAAAAAAAA',
    )
    await user.click(screen.getByLabelText('Confermo che il volto nel video è offuscato'))
    await user.click(screen.getByRole('button', { name: 'Proponi esercizio' }))
  }

  it("invia la proposta al worker e conferma l'esito", async () => {
    const calls = stubNetwork()
    const user = userEvent.setup()
    render(<App />)
    await proponi(user)

    expect(await screen.findByText('Proposta inviata alla community!')).toBeInTheDocument()
    expect(calls.some((c) => c.url.endsWith('/exercises'))).toBe(true)
    // In ogni caso l'esercizio è già mio, in locale
    expect(screen.getByRole('heading', { name: 'Squat frontale' })).toBeInTheDocument()
  })

  it("se il worker è irraggiungibile l'esercizio resta salvato sul dispositivo", async () => {
    stubNetwork({ workerFails: true })
    const user = userEvent.setup()
    render(<App />)
    await proponi(user)

    expect(await screen.findByText(/Salvato solo sul dispositivo/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Squat frontale' })).toBeInTheDocument()
  })
})
