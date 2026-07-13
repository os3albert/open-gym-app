// Test di integrazione della M5 (issue #26): tema chiaro/scuro persistito sul dispositivo.
// Da M12 il tema vive nella vista Impostazioni, non più nella barra in alto.
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../src/App'
import { THEME_STORAGE_KEY } from '../../src/hooks/useTheme'
import { scegliOpzione } from './helpers'

beforeEach(() => {
  localStorage.clear()
  window.history.replaceState(null, '', '/')
  delete document.documentElement.dataset.theme
})

/** Il tema si sceglie da Impostazioni: ci si arriva dalla barra in basso. */
async function apriImpostazioni(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Impostazioni' }))
}

describe('tema chiaro/scuro (issue #26)', () => {
  it('di default segue il sistema; senza informazione resta il tema scuro', async () => {
    const user = userEvent.setup()
    render(<App />)
    await apriImpostazioni(user)

    // Il select è un menu MUI: la scelta corrente si legge dal testo mostrato, non da un value
    expect(screen.getByLabelText('Tema')).toHaveTextContent('Auto')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it("l'utente può forzare il tema chiaro e la scelta sopravvive al riavvio", async () => {
    const user = userEvent.setup()
    const first = render(<App />)
    await apriImpostazioni(user)

    await scegliOpzione(user, 'Tema', 'Chiaro')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('chiaro')

    // «Riavvio» dell'app: la preferenza viene riletta dal dispositivo
    first.unmount()
    render(<App />)
    await apriImpostazioni(user)
    expect(screen.getByLabelText('Tema')).toHaveTextContent('Chiaro')
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('si può tornare al tema scuro esplicito', async () => {
    const user = userEvent.setup()
    render(<App />)
    await apriImpostazioni(user)

    await scegliOpzione(user, 'Tema', 'Chiaro')
    await scegliOpzione(user, 'Tema', 'Scuro')

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('scuro')
  })
})
