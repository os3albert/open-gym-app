// Integrazione della sezione «Schede» della community: catalogo, voto, prova e proposta.
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../src/App'
import type { CommunityPlan } from '../../src/services/communityData'
import { scegliGiorno, scegliGruppo, scegliOpzione } from './helpers'

const WORKER = 'https://worker.example'

const schede: CommunityPlan[] = [
  {
    id: 'plan-community',
    name: 'Perdere peso — Full body',
    createdAt: '2026-07-19T00:00:00.000Z',
    days: [
      {
        name: 'Lunedì',
        entries: [
          {
            exercise: {
              name: 'jump squat',
              description: 'Salta dal mezzo squat.',
              youtubeUrl: '',
              gifUrl: 'https://raw.githubusercontent.com/example/dataset/abc/gifs/514.gif',
              attribution: '© Gym visual — https://gymvisual.com/',
              muscleGroup: 'glutes',
              difficulty: 'medium',
              faceBlurConfirmed: false,
            },
            sets: 3,
            reps: 15,
          },
        ],
      },
    ],
  },
]

/** File grezzi del repo (esercizi + schede) e worker; le chiamate al worker si registrano. */
function stubNetwork(
  options: { planVotes?: Record<string, string[]>; workerFails?: boolean } = {},
) {
  const calls: Array<{ url: string; body: unknown }> = []
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if (url.endsWith('/exercises.json')) return Response.json([])
    if (url.endsWith('/votes.json')) return Response.json({})
    if (url.endsWith('/plans.json')) return Response.json(schede)
    if (url.endsWith('/plan-votes.json')) return Response.json(options.planVotes ?? {})
    if (url.startsWith(WORKER)) {
      calls.push({ url, body: JSON.parse(String(init?.body)) })
      if (options.workerFails) return Response.json({ error: 'Community offline' }, { status: 503 })
      if (url.endsWith('/plan-votes')) return Response.json({ votes: 5 })
      return Response.json({ plan: { id: 'plan-nuovo' } }, { status: 201 })
    }
    throw new Error(`URL non previsto nel test: ${url}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  return calls
}

beforeEach(() => {
  localStorage.clear()
  // La sezione schede della community vive in ?sezione=schede (gli esercizi restano l'atterraggio)
  window.history.replaceState(null, '', '/?vista=community&sezione=schede')
  vi.stubEnv('VITE_COMMUNITY_API_URL', WORKER)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('le schede proposte dalla community', () => {
  it('mostra le schede del catalogo con giorni, esercizi e voti', async () => {
    stubNetwork({ planVotes: { 'plan-community': ['hash-a', 'hash-b'] } })
    render(<App />)

    const heading = await screen.findByRole('heading', { name: 'Perdere peso — Full body' })
    const card = heading.closest('[data-cy=community-plan-item]') as HTMLElement
    expect(within(card).getByText('1 giorni · 1 esercizi')).toBeInTheDocument()
    expect(within(card).getByText(/jump squat 3×15/)).toBeInTheDocument()
    expect(within(card).getByText('2')).toBeInTheDocument()
  })

  it('il voto va al worker e il conteggio adottato è il suo', async () => {
    const calls = stubNetwork()
    const user = userEvent.setup()
    render(<App />)
    const heading = await screen.findByRole('heading', { name: 'Perdere peso — Full body' })
    const card = heading.closest('[data-cy=community-plan-item]') as HTMLElement

    await user.click(within(card).getByRole('button', { name: 'Vota Perdere peso — Full body' }))

    await waitFor(() => expect(within(card).getByText('5')).toBeInTheDocument())
    const vote = calls.find((c) => c.url.endsWith('/plan-votes'))!
    expect(vote.body).toEqual({ planId: 'plan-community', action: 'add' })
  })

  it('se il worker rifiuta il voto, il conteggio torna indietro con un messaggio', async () => {
    stubNetwork({ workerFails: true })
    const user = userEvent.setup()
    render(<App />)
    const heading = await screen.findByRole('heading', { name: 'Perdere peso — Full body' })
    const card = heading.closest('[data-cy=community-plan-item]') as HTMLElement

    await user.click(within(card).getByRole('button', { name: 'Vota Perdere peso — Full body' }))

    expect(await screen.findByText('Community offline')).toBeInTheDocument()
    expect(within(card).getByText('0')).toBeInTheDocument()
  })

  it('«Prova questa scheda» la importa tra le mie e la attiva', async () => {
    stubNetwork()
    const user = userEvent.setup()
    render(<App />)
    const heading = await screen.findByRole('heading', { name: 'Perdere peso — Full body' })
    const card = heading.closest('[data-cy=community-plan-item]') as HTMLElement

    await user.click(within(card).getByRole('button', { name: 'Prova questa scheda' }))

    expect(await screen.findByText('Scheda aggiunta alle tue e attivata!')).toBeInTheDocument()

    // Nella vista Schede la scheda c'è davvero, già attiva (badge, niente bottone «Attiva»)
    await user.click(screen.getByRole('button', { name: 'Schede' }))
    expect(await screen.findByText('Perdere peso — Full body')).toBeInTheDocument()
    expect(screen.getByText('✓ attiva')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Attiva' })).not.toBeInTheDocument()
  })
})

describe('proporre una scheda alla community', () => {
  it('pubblica una mia scheda con gli esercizi incorporati', async () => {
    const calls = stubNetwork()
    const user = userEvent.setup()
    render(<App />)

    // Prima serve una scheda mia con un esercizio: la si costruisce dall'app
    await user.click(screen.getByRole('button', { name: 'Schede' }))
    await user.type(screen.getByLabelText('Nuova scheda'), 'La mia scheda')
    await user.click(screen.getByRole('button', { name: 'Crea scheda' }))
    await user.click(screen.getByRole('button', { name: 'Modifica' }))
    await scegliGiorno(user, 'Lunedì')
    await user.click(screen.getByRole('button', { name: 'Aggiungi giorno' }))
    await user.click(screen.getByRole('button', { name: 'Attiva' }))

    // Un esercizio mio da mettere in scheda (il form è nella vista Community)
    await user.click(screen.getByRole('button', { name: 'Community' }))
    // Si atterra sulla sezione schede (?sezione=schede): il form esercizi sta nell'altra
    await user.click(screen.getByRole('tab', { name: 'Esercizi' }))
    await user.click(screen.getByRole('button', { name: 'Nuova proposta' }))
    await user.type(screen.getByLabelText('Nome esercizio'), 'Squat frontale')
    await user.type(
      screen.getByLabelText('Link YouTube (volto offuscato)'),
      'https://youtu.be/AAAAAAAAAAA',
    )
    await scegliGruppo(user, 'Gambe')
    await scegliOpzione(user, 'Difficoltà', 'Media')
    await user.click(screen.getByRole('button', { name: 'Proponi esercizio' }))

    const item = (await screen.findByRole('heading', { name: 'Squat frontale' })).closest('li')!
    await user.click(within(item).getByRole('button', { name: 'Aggiungi alla scheda' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Aggiungi' }))

    // Ora la proposta della scheda, dalla sezione schede
    await user.click(screen.getByRole('tab', { name: 'Schede' }))
    await user.click(screen.getByRole('button', { name: 'Proponi scheda' }))
    const proposta = await screen.findByRole('dialog')
    expect(within(proposta).getByLabelText('Scheda da proporre')).toHaveTextContent('La mia scheda')
    await user.click(within(proposta).getByRole('button', { name: 'Invia proposta' }))

    expect(await screen.findByText('Scheda inviata alla community!')).toBeInTheDocument()
    const sent = calls.find((c) => c.url.endsWith('/plans'))!
    const body = sent.body as { name: string; days: Array<{ name: string; entries: unknown[] }> }
    expect(body.name).toBe('La mia scheda')
    expect(body.days[0].name).toBe('Lunedì')
    // Gli esercizi viaggiano INCORPORATI, come nella condivisione
    expect(JSON.stringify(body.days[0].entries[0])).toContain('Squat frontale')
  })

  it('senza schede con esercizi lo dice, invece di inviare una proposta vuota', async () => {
    stubNetwork()
    const user = userEvent.setup()
    render(<App />)
    await screen.findByRole('heading', { name: 'Perdere peso — Full body' })

    await user.click(screen.getByRole('button', { name: 'Proponi scheda' }))

    const dialog = await screen.findByRole('dialog')
    expect(
      within(dialog).getByText('Non hai ancora schede da proporre: creane una nella vista Schede.'),
    ).toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: 'Invia proposta' })).not.toBeInTheDocument()
  })
})
