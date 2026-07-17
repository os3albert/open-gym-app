// Integrazione della community (M8): catalogo condiviso, proposta e voto verso il worker.
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../src/App'
import type { CommunityExercise } from '../../src/services/communityData'
import { scegliGiorno, scegliGruppo, scegliOpzione } from './helpers'

const WORKER = 'https://worker.example'

const catalog: CommunityExercise[] = [
  {
    id: 'ex-community',
    name: 'Military press',
    description: 'Spinta sopra la testa',
    youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
    muscleGroup: 'shoulders',
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
  // La lista della community si esercita da lì: da M16 l'atterraggio nudo è la Home
  window.history.replaceState(null, '', '/?vista=community')
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
    await scegliGruppo(user, 'Petto')
    await scegliOpzione(user, 'Difficoltà', 'Media')
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
        muscleGroup: 'legs',
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

describe('un catalogo grande dentro la community (M16)', () => {
  // Catalogo sintetico nella forma delle voci del dataset (GIF, niente video, niente
  // difficoltà): dal 2026-07 i gv-* non stanno più in community/exercises.json, ma la
  // filiera (fetch → merge → ricerca → paginazione → GIF con attribuzione) deve reggere
  // comunque un catalogo che non entra in una pagina.
  const catalogoGrande: CommunityExercise[] = Array.from({ length: 60 }, (_, i) => ({
    id: `gv-${String(i + 1).padStart(4, '0')}`,
    name: i === 0 ? '3/4 sit-up' : `Esercizio del catalogo ${i + 1}`,
    description: 'Sdraiati sulla schiena con le ginocchia piegate.',
    youtubeUrl: '',
    // gifUrl UNICA per voce: le voci senza video si deduplicano proprio su questa
    gifUrl: `https://raw.githubusercontent.com/example/dataset/abc/videos/${i + 1}.gif`,
    attribution: '© Gym visual — https://gymvisual.com/',
    muscleGroup: 'core',
    faceBlurConfirmed: false,
    createdAt: '2026-03-18T12:31:32.854798+00:00',
  }))

  function stubCatalogoGrande() {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url.endsWith('/exercises.json')) return Response.json(catalogoGrande)
        if (url.endsWith('/votes.json')) return Response.json({})
        throw new Error(`URL non previsto nel test: ${url}`)
      }),
    )
  }

  it('si carica intero, ma in pagina va una pagina alla volta', async () => {
    stubCatalogoGrande()
    render(<App />)

    // La prima pagina: 24 card, non tutte — con un catalogo grande il DOM non reggerebbe
    await waitFor(() =>
      expect(document.querySelectorAll('[data-cy=exercise-item]')).toHaveLength(24),
    )
    expect(screen.getByText(`24 di ${catalogoGrande.length} esercizi`)).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Mostra altri' }))
    expect(document.querySelectorAll('[data-cy=exercise-item]')).toHaveLength(48)
  })

  it('la ricerca per nome restringe il catalogo, e la card ha GIF e attribuzione', async () => {
    stubCatalogoGrande()
    const user = userEvent.setup()
    render(<App />)
    await waitFor(() =>
      expect(document.querySelectorAll('[data-cy=exercise-item]').length).toBeGreaterThan(0),
    )

    await user.type(screen.getByLabelText('Cerca per nome'), '3/4 sit-up')

    const cards = document.querySelectorAll('[data-cy=exercise-item]')
    expect(cards.length).toBeGreaterThanOrEqual(1)
    expect(cards.length).toBeLessThan(24)
    const card = screen.getByRole('heading', { name: '3/4 sit-up' }).closest('li')!
    expect(
      within(card).getByRole('img', { name: 'Dimostrazione animata di 3/4 sit-up' }),
    ).toBeInTheDocument()
    expect(within(card).getByRole('link', { name: /© Gym visual/ })).toBeInTheDocument()
  })
})

describe('«Aggiungi alla scheda» dalla Community (M15)', () => {
  it('un esercizio del catalogo entra nella scheda, e diventa anche un esercizio mio', async () => {
    stubNetwork()
    const user = userEvent.setup()
    render(<App />)

    // Prima serve una scheda con un giorno: la si crea dall'app, per non dover indovinare
    // gli id generati
    await user.click(screen.getByRole('button', { name: 'Schede' }))
    await user.type(screen.getByLabelText('Nuova scheda'), 'Full Body')
    await user.click(screen.getByRole('button', { name: 'Crea scheda' }))
    await user.click(screen.getByRole('button', { name: 'Modifica' }))
    await scegliGiorno(user, 'Lunedì')
    await user.click(screen.getByRole('button', { name: 'Aggiungi giorno' }))
    await user.click(screen.getByRole('button', { name: 'Attiva' }))

    await user.click(screen.getByRole('button', { name: 'Community' }))
    const card = (await screen.findByRole('heading', { name: 'Military press' })).closest('li')!
    await user.click(within(card).getByRole('button', { name: 'Aggiungi alla scheda' }))

    // La scheda attiva e il suo unico giorno sono già scelti: basta confermare
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByLabelText('Scheda')).toHaveTextContent('Full Body')
    expect(within(dialog).getByLabelText('Giorno')).toHaveTextContent('Lunedì')
    await user.click(within(dialog).getByRole('button', { name: 'Aggiungi' }))

    // Il modale si chiude e la conferma è leggibile: dietro a un Dialog aperto la lista è
    // aria-hidden, e nessuno leggerebbe niente
    expect(screen.getByRole('status')).toHaveTextContent(
      '«Military press» è ora in Full Body — Lunedì.',
    )

    // Nella scheda c'è davvero, col target scelto
    await user.click(screen.getByRole('button', { name: 'Schede' }))
    await user.click(screen.getByRole('button', { name: 'Modifica' }))
    expect(screen.getByText('Military press — 3×8')).toBeInTheDocument()
  })

  it('senza nessuna scheda lo dice, invece di far premere un bottone che non farebbe nulla', async () => {
    stubNetwork()
    const user = userEvent.setup()
    render(<App />)
    const card = (await screen.findByRole('heading', { name: 'Military press' })).closest('li')!

    await user.click(within(card).getByRole('button', { name: 'Aggiungi alla scheda' }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('status')).toHaveTextContent('Non hai ancora una scheda')
    expect(within(dialog).getByRole('button', { name: 'Aggiungi' })).toBeDisabled()
  })
})
