// Test di integrazione della M5 (issue #26): tema chiaro/scuro persistito sul dispositivo.
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../src/App'
import { THEME_STORAGE_KEY } from '../../src/hooks/useTheme'

beforeEach(() => {
  localStorage.clear()
  window.history.replaceState(null, '', '/')
  delete document.documentElement.dataset.theme
})

describe('tema chiaro/scuro (issue #26)', () => {
  it('di default segue il sistema; senza informazione resta il tema scuro', () => {
    render(<App />)
    expect(screen.getByLabelText('Tema')).toHaveValue('auto')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it("l'utente può forzare il tema chiaro e la scelta sopravvive al riavvio", async () => {
    const user = userEvent.setup()
    const first = render(<App />)

    await user.selectOptions(screen.getByLabelText('Tema'), 'Chiaro')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('chiaro')

    // «Riavvio» dell'app: la preferenza viene riletta dal dispositivo
    first.unmount()
    render(<App />)
    expect(screen.getByLabelText('Tema')).toHaveValue('chiaro')
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('si può tornare al tema scuro esplicito', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.selectOptions(screen.getByLabelText('Tema'), 'Chiaro')
    await user.selectOptions(screen.getByLabelText('Tema'), 'Scuro')

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('scuro')
  })
})
