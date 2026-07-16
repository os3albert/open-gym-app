// Test di integrazione UI: App reale + dominio + localStorage (jsdom), senza mock.
import '@testing-library/jest-dom/vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../src/App'
import { it as itDict } from '../../src/i18n/it'
import { scegliGruppo, scegliNumero, scegliOpzione } from './helpers'
import { INVALID_YOUTUBE_LINK_ERROR } from '../../src/domain/exercises'

beforeEach(() => {
  localStorage.clear()
  // useFilters scrive la query string: va ripulita tra un test e l'altro
  // Questi test esercitano la lista della community: ci si porta lì dalla query string,
  // che è il meccanismo dell'app (da M16 l'atterraggio nudo è la Home)
  window.history.replaceState(null, '', '/?vista=community')
})

/** Il form di proposta vive in un modale (M12): si apre dal FAB «Nuova proposta». No-op se è già aperto. */
async function openProposeForm() {
  if (screen.queryByLabelText('Nome esercizio')) return
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Nuova proposta' }))
  // Il pannello deve essere davvero in pagina prima di scriverci dentro
  await screen.findByLabelText('Nome esercizio')
}

async function proposeExercise(
  name: string,
  youtubeUrl: string,
  stature?: { min: number; max: number },
) {
  const user = userEvent.setup()
  await openProposeForm()
  await user.type(screen.getByLabelText('Nome esercizio'), name)
  await scegliGruppo(user, 'Petto')
  if (stature) {
    await scegliNumero(user, 'Statura consigliata da (cm)', String(stature.min))
    await scegliNumero(user, 'a (cm)', String(stature.max))
  }
  await user.type(screen.getByLabelText('Link YouTube (volto offuscato)'), youtubeUrl)
  await scegliOpzione(user, 'Difficoltà', 'Media')
  await user.click(screen.getByRole('button', { name: /Proponi esercizio|Salva modifiche/ }))
}

describe('proposta di un esercizio', () => {
  it('propone un esercizio e lo mostra in elenco con i badge', async () => {
    render(<App />)
    await proposeExercise('Panca piana', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', {
      min: 170,
      max: 190,
    })

    expect(screen.getByRole('heading', { name: 'Panca piana' })).toBeInTheDocument()
    expect(screen.getByText('170–190 cm')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it("mostra l'errore e non salva nulla con un link non YouTube", async () => {
    render(<App />)
    await proposeExercise('Squat', 'https://vimeo.com/12345')

    expect(screen.getByRole('alert')).toHaveTextContent(
      itDict[`errors.${INVALID_YOUTUBE_LINK_ERROR}`],
    )
    expect(screen.queryByRole('heading', { name: 'Squat' })).not.toBeInTheDocument()
  })

  it('il form di proposta è chiuso di partenza sulla lista della community', () => {
    render(<App />)
    expect(screen.queryByLabelText('Nome esercizio')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Esercizi della community' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nuova proposta' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('senza parametri si atterra sulla HOME: progresso settimanale e giorni della scheda (M16)', () => {
    window.history.replaceState(null, '', '/')
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Progresso settimanale' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'I giorni della tua scheda' })).toBeInTheDocument()
    // La lista della community non è qui: è nella sua tab
    expect(
      screen.queryByRole('heading', { name: 'Esercizi della community' }),
    ).not.toBeInTheDocument()
  })

  it('il FAB apre il form in un modale, e a salvataggio riuscito si richiude (M12)', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Nuova proposta' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Nome esercizio'), 'Rematore')
    await user.type(
      screen.getByLabelText('Link YouTube (volto offuscato)'),
      'https://youtu.be/dQw4w9WgXcQ',
    )
    await scegliGruppo(user, 'Gambe')
    await scegliOpzione(user, 'Difficoltà', 'Facile')
    await user.click(screen.getByRole('button', { name: 'Proponi esercizio' }))

    // Il modale non deve restare davanti al risultato
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Rematore' })).toBeInTheDocument()
  })

  it('anche «Modifica» apre lo stesso modale, con i campi precaricati (M12)', async () => {
    const user = userEvent.setup()
    render(<App />)
    await proposeExercise('Squat', 'https://youtu.be/dQw4w9WgXcQ')

    await user.click(screen.getByRole('button', { name: 'Modifica' }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByLabelText('Nome esercizio')).toHaveValue('Squat')
    expect(within(dialog).getByRole('button', { name: 'Salva modifiche' })).toBeInTheDocument()
  })

  it('il volto offuscato non è più obbligatorio: resta solo la dicitura (M12)', async () => {
    render(<App />)
    await openProposeForm()

    expect(screen.queryByLabelText(/volto nel video è offuscato/)).not.toBeInTheDocument()
    expect(screen.getByText(/Il volto non è importante/)).toBeInTheDocument()
    // Il submit non è più bloccato da una spunta
    expect(screen.getByRole('button', { name: 'Proponi esercizio' })).toBeEnabled()
  })
})

describe('voti', () => {
  it("l'upvote incrementa i voti e risulta attivo; un secondo click lo rimuove", async () => {
    const user = userEvent.setup()
    render(<App />)
    await proposeExercise('Trazioni', 'https://youtu.be/dQw4w9WgXcQ')

    const item = screen.getByRole('heading', { name: 'Trazioni' }).closest('li')!
    const voteButton = within(item).getByRole('button', { name: 'Vota Trazioni' })
    await user.click(voteButton)

    expect(within(item).getByText('1')).toBeInTheDocument()
    expect(
      within(item).getByRole('button', { name: 'Rimuovi il voto a Trazioni' }),
    ).toHaveAttribute('aria-pressed', 'true')

    await user.click(within(item).getByRole('button', { name: 'Rimuovi il voto a Trazioni' }))
    expect(within(item).getByText('0')).toBeInTheDocument()
  })
})

describe('modifica ed eliminazione', () => {
  it('modifica un esercizio esistente', async () => {
    const user = userEvent.setup()
    render(<App />)
    await proposeExercise('Panca piana', 'https://youtu.be/dQw4w9WgXcQ')

    await user.click(screen.getByRole('button', { name: 'Modifica' }))
    const nameInput = screen.getByLabelText('Nome esercizio')
    expect(nameInput).toHaveValue('Panca piana')

    await user.clear(nameInput)
    await user.type(nameInput, 'Panca inclinata')
    await user.click(screen.getByRole('button', { name: 'Salva modifiche' }))

    expect(screen.getByRole('heading', { name: 'Panca inclinata' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Panca piana' })).not.toBeInTheDocument()
  })

  it('elimina un esercizio solo dopo la conferma', async () => {
    const user = userEvent.setup()
    render(<App />)
    await proposeExercise('Affondi', 'https://youtu.be/dQw4w9WgXcQ')

    await user.click(screen.getByRole('button', { name: 'Elimina' }))
    expect(screen.getByRole('heading', { name: 'Affondi' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Conferma eliminazione' }))
    expect(screen.queryByRole('heading', { name: 'Affondi' })).not.toBeInTheDocument()
  })
})

describe('filtro per statura', () => {
  it('senza statura nel profilo chiede di inserirla', async () => {
    const user = userEvent.setup()
    render(<App />)
    await proposeExercise('Panca piana', 'https://youtu.be/dQw4w9WgXcQ')

    await user.click(screen.getByLabelText('Adatti a me'))
    expect(screen.getByText(/inserisci prima la tua statura/)).toBeInTheDocument()
  })

  it('con la statura impostata mostra solo gli esercizi adatti', async () => {
    const user = userEvent.setup()
    render(<App />)
    await proposeExercise('Per alti', 'https://youtu.be/dQw4w9WgXcQ', { min: 180, max: 200 })
    await proposeExercise('Per bassi', 'https://youtu.be/dQw4w9WgXcQ', { min: 150, max: 165 })

    await scegliNumero(user, 'La mia statura (cm)', '185')
    await user.click(screen.getByRole('button', { name: 'Salva' }))
    await user.click(screen.getByLabelText('Adatti a me'))

    expect(screen.getByRole('heading', { name: 'Per alti' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Per bassi' })).not.toBeInTheDocument()
  })
})

describe('persistenza', () => {
  it('i dati sopravvivono a uno smontaggio e rimontaggio (localStorage)', async () => {
    const first = render(<App />)
    await proposeExercise('Affondi', 'https://youtu.be/dQw4w9WgXcQ')
    first.unmount()

    render(<App />)
    expect(screen.getByRole('heading', { name: 'Affondi' })).toBeInTheDocument()
  })

  it('con dati corrotti mostra il banner e propone il ripristino da backup', () => {
    localStorage.setItem('open-gym-app/data', '{***}')
    render(<App />)
    expect(screen.getByRole('alert')).toHaveTextContent(/backup/)
  })
})
