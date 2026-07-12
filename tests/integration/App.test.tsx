// Test di integrazione UI: App reale + dominio + localStorage (jsdom), senza mock.
import '@testing-library/jest-dom/vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../src/App'
import { FACE_BLUR_REQUIRED_ERROR, INVALID_YOUTUBE_LINK_ERROR } from '../../src/domain/exercises'

beforeEach(() => {
  localStorage.clear()
  // useFilters scrive la query string: va ripulita tra un test e l'altro
  window.history.replaceState(null, '', '/')
})

/** Il form di proposta è collassato: si apre dal bottone «Nuova proposta» (issue #37). No-op se è già aperto. */
async function openProposeForm() {
  if (screen.queryByLabelText('Nome esercizio')) return
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Nuova proposta' }))
}

async function proposeExercise(
  name: string,
  youtubeUrl: string,
  stature?: { min: number; max: number },
) {
  const user = userEvent.setup()
  await openProposeForm()
  await user.type(screen.getByLabelText('Nome esercizio'), name)
  await user.type(screen.getByLabelText('Gruppo muscolare'), 'Petto')
  if (stature) {
    await user.type(screen.getByLabelText('Statura consigliata da (cm)'), String(stature.min))
    await user.type(screen.getByLabelText('a (cm)'), String(stature.max))
  }
  await user.type(screen.getByLabelText('Link YouTube (volto offuscato)'), youtubeUrl)
  await user.click(screen.getByLabelText('Confermo che il volto nel video è offuscato'))
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
    expect(screen.getByText('✓ volto offuscato')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it("mostra l'errore e non salva nulla con un link non YouTube", async () => {
    render(<App />)
    await proposeExercise('Squat', 'https://vimeo.com/12345')

    expect(screen.getByRole('alert')).toHaveTextContent(INVALID_YOUTUBE_LINK_ERROR)
    expect(screen.queryByRole('heading', { name: 'Squat' })).not.toBeInTheDocument()
  })

  it('senza conferma del volto offuscato il pulsante di invio è disabilitato', async () => {
    render(<App />)
    await openProposeForm()
    expect(screen.getByRole('button', { name: 'Proponi esercizio' })).toBeDisabled()
  })

  it('il form di proposta è chiuso di partenza: si atterra sulla lista della community', () => {
    render(<App />)
    expect(screen.queryByLabelText('Nome esercizio')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Esercizi della community' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nuova proposta' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it(`il dominio rifiuta comunque la proposta senza conferma (messaggio: ${FACE_BLUR_REQUIRED_ERROR})`, async () => {
    // La checkbox disabilita il submit: qui si verifica solo che la difesa esista anche nel dominio
    const { createExercise } = await import('../../src/domain/exercises')
    expect(() =>
      createExercise({
        name: 'X',
        description: '',
        youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
        muscleGroup: '',
        faceBlurConfirmed: false,
      }),
    ).toThrow(FACE_BLUR_REQUIRED_ERROR)
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

    await user.type(screen.getByLabelText('La mia statura (cm)'), '185')
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
