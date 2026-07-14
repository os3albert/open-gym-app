// Vista Impostazioni (M12): lingua, tema e backup in un posto solo.
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../src/App'
import { LANGUAGE_STORAGE_KEY } from '../../src/hooks/useLanguage'
import { scegliOpzione } from './helpers'

beforeEach(() => {
  localStorage.clear()
  window.history.replaceState(null, '', '/')
})

async function apriImpostazioni(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Impostazioni' }))
}

describe('scelta della lingua (issue #63)', () => {
  it("all'avvio l'app è in italiano, senza chiedere niente al browser", async () => {
    const user = userEvent.setup()
    render(<App />)
    await apriImpostazioni(user)

    expect(screen.getByLabelText('Lingua')).toHaveTextContent('Italiano')
    expect(document.documentElement.lang).toBe('it')
  })

  it("scegliendo l'inglese l'interfaccia cambia lingua e la scelta sopravvive al riavvio", async () => {
    const user = userEvent.setup()
    const first = render(<App />)
    await apriImpostazioni(user)

    await scegliOpzione(user, 'Lingua', 'English')

    // La navigazione, i titoli e i pannelli passano all'inglese
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByText('Data backup')).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('en')
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en')

    // «Riavvio»: la lingua viene riletta dal dispositivo, non ridedotta dal browser
    first.unmount()
    render(<App />)
    expect(screen.getByRole('button', { name: 'Exercises' })).toBeInTheDocument()
  })

  it('gli errori di dominio parlano la lingua scelta, non quella del codice', async () => {
    const user = userEvent.setup()
    render(<App />)
    await apriImpostazioni(user)
    await scegliOpzione(user, 'Lingua', 'English')

    await user.click(screen.getByRole('button', { name: 'Exercises' }))
    await user.click(screen.getByRole('button', { name: 'New proposal' }))
    await user.click(await screen.findByRole('button', { name: 'Propose exercise' }))

    // Il dominio lancia EMPTY_NAME: la frase la sceglie la lingua
    expect(screen.getByRole('alert')).toHaveTextContent('The exercise name is required')
  })
})

describe('il backup vive nelle impostazioni', () => {
  it('non ingombra più le altre viste', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.queryByText('Backup dei dati')).not.toBeInTheDocument()

    await apriImpostazioni(user)
    expect(screen.getByText('Backup dei dati')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Esporta backup JSON' })).toBeInTheDocument()
  })
})
