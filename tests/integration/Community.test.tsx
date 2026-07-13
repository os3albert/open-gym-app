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
function stubNetwork(
  options: {
    votes?: Record<string, string[]>
    workerFails?: boolean
    /** Conteggio autorevole restituito dal worker su /votes. */
    voteResponse?: number
    /** Voce che il worker aggiunge al catalogo quando accetta la proposta (id suo, non mio). */
    accepted?: CommunityExercise
  } = {},
) {
  const calls: Array<{ url: string; body: unknown }> = []
  let accepted = false
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if (url.endsWith('/exercises.json')) {
      const accettati = accepted && options.accepted ? [options.accepted] : []
      return Response.json([...catalog, ...accettati])
    }
    if (url.endsWith('/votes.json')) return Response.json(options.votes ?? {})
    if (url.startsWith(WORKER)) {
      calls.push({ url, body: JSON.parse(String(init?.body)) })
      if (options.workerFails) return Response.json({ error: 'Community offline' }, { status: 503 })
      if (url.endsWith('/votes')) return Response.json({ votes: options.voteResponse ?? 1 })
      accepted = true
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

  it('votare un esercizio condiviso invia il voto e adotta il conteggio del worker', async () => {
    const calls = stubNetwork({ voteResponse: 7 })
    const user = userEvent.setup()
    render(<App />)
    const item = (await screen.findByRole('heading', { name: 'Military press' })).closest('li')!

    await user.click(within(item).getByRole('button', { name: 'Vota Military press' }))

    // Il conteggio autorevole è quello del worker, non quello indovinato dall'app
    await waitFor(() => expect(within(item).getByText('7')).toBeInTheDocument())
    const vote = calls.find((c) => c.url.endsWith('/votes'))!
    expect(vote.body).toEqual({ exerciseId: 'ex-community', action: 'add' })
    // Il client NON manda identificatori: chi vota lo stabilisce il worker (voti non falsificabili)
    expect(JSON.stringify(vote.body)).not.toMatch(/hash|device|id"\s*:\s*"[a-f0-9]{64}/i)
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

  /**
   * Il caso che teneva votes.json vuoto: chi propone vede la PROPRIA copia locale (id locale),
   * quindi il suo voto finiva nel reducer locale e non partiva alcuna richiesta. Accettata la
   * proposta, la card deve diventare quella della community e il voto deve andare al worker.
   */
  it('votando ciò che ho proposto, il voto va al worker con l’id della community', async () => {
    const calls = stubNetwork({
      // Stesso video della proposta, id diverso: è il worker a generarlo
      accepted: {
        id: 'ex-accettato',
        name: 'Squat frontale',
        description: '',
        youtubeUrl: 'https://youtu.be/AAAAAAAAAAA',
        muscleGroup: 'Gambe',
        faceBlurConfirmed: true,
        createdAt: '2026-07-13T10:00:00.000Z',
      },
      voteResponse: 3,
    })
    const user = userEvent.setup()
    render(<App />)
    await proponi(user)

    // Una sola card, e ora è della community (non c'è più il doppione locale)
    const heading = await screen.findByRole('heading', { name: 'Squat frontale' })
    const item = heading.closest('li')!
    await waitFor(() => expect(within(item).getByText('community')).toBeInTheDocument())
    expect(screen.getAllByRole('heading', { name: 'Squat frontale' })).toHaveLength(1)

    await user.click(within(item).getByRole('button', { name: 'Vota Squat frontale' }))

    const vote = await waitFor(() => calls.find((c) => c.url.endsWith('/votes'))!)
    expect(vote.body).toEqual({ exerciseId: 'ex-accettato', action: 'add' })
    await waitFor(() => expect(within(item).getByText('3')).toBeInTheDocument())
  })
})
