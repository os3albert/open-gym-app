// Test di integrazione della M11: invito a installare la PWA (Chrome) e istruzione iOS.
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../src/App'

/** Riproduce l'evento che Chrome emette quando l'app è installabile (non è nei tipi DOM). */
function fireBeforeInstallPrompt() {
  const event = new Event('beforeinstallprompt', { cancelable: true })
  const prompt = vi.fn().mockResolvedValue(undefined)
  Object.assign(event, { prompt, userChoice: Promise.resolve({ outcome: 'accepted' }) })
  window.dispatchEvent(event)
  return { event, prompt }
}

beforeEach(() => {
  localStorage.clear()
  // Da M18 il pannello d'installazione vive in Impostazioni (nell'hero): i test partono da lì
  window.history.replaceState(null, '', '/?vista=impostazioni')
})

describe('installazione della PWA', () => {
  it('senza annuncio del browser non propone nulla', () => {
    render(<App />)
    expect(screen.queryByRole('button', { name: "Installa l'app" })).toBeNull()
  })

  it("propone l'installazione quando il browser la annuncia, e apre la finestra del browser", async () => {
    const user = userEvent.setup()
    render(<App />)

    const { event, prompt } = fireBeforeInstallPrompt()
    // L'invito lo diamo noi: l'evento va annullato, o Chrome mostra la sua mini-infobar
    expect(event.defaultPrevented).toBe(true)

    const button = await screen.findByRole('button', { name: "Installa l'app" })
    await user.click(button)
    expect(prompt).toHaveBeenCalledOnce()

    // L'evento è monouso: consumato, l'invito sparisce
    expect(screen.queryByRole('button', { name: "Installa l'app" })).toBeNull()
  })

  it('a installazione avvenuta non propone più nulla', async () => {
    render(<App />)
    fireBeforeInstallPrompt()
    expect(await screen.findByRole('button', { name: "Installa l'app" })).toBeInTheDocument()

    window.dispatchEvent(new Event('appinstalled'))
    await waitFor(() => expect(screen.queryByRole('button', { name: "Installa l'app" })).toBeNull())
  })
})
