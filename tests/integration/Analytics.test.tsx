// Integrazione delle statistiche anonime (M9): niente script senza configurazione, opt-out reale.
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../src/App'

const SRC = 'https://umami.example/script.js'
const ID = 'sito-123'

const umamiScript = () => document.getElementById('umami-analytics')

beforeEach(() => {
  localStorage.clear()
  window.history.replaceState(null, '', '/')
  umamiScript()?.remove()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('statistiche anonime', () => {
  it("senza configurazione non carica nulla e non mostra l'interruttore", () => {
    render(<App />)

    expect(umamiScript()).toBe(null)
    expect(document.querySelector('[data-cy=privacy-panel]')).toBe(null)
  })

  it("con l'istanza configurata carica lo script cookieless e offre l'interruttore", () => {
    vi.stubEnv('VITE_UMAMI_SRC', SRC)
    vi.stubEnv('VITE_UMAMI_WEBSITE_ID', ID)
    render(<App />)

    const script = umamiScript() as HTMLScriptElement
    expect(script).not.toBe(null)
    expect(script.src).toBe(SRC)
    expect(script.dataset.websiteId).toBe(ID)
    expect(document.querySelector('[data-cy=privacy-panel]')).not.toBe(null)
  })

  it('disattivandole lo script sparisce dalla pagina e la scelta resta salvata', async () => {
    vi.stubEnv('VITE_UMAMI_SRC', SRC)
    vi.stubEnv('VITE_UMAMI_WEBSITE_ID', ID)
    const user = userEvent.setup()
    const first = render(<App />)

    await user.click(screen.getByRole('switch', { name: /Statistiche anonime/ }))

    await waitFor(() => expect(umamiScript()).toBe(null))

    // Al riavvio dell'app la scelta è rispettata: niente script
    first.unmount()
    render(<App />)
    expect(umamiScript()).toBe(null)
    expect(screen.getByRole('switch', { name: /Statistiche anonime/ })).not.toBeChecked()
  })
})
