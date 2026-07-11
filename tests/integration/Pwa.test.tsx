// Test di integrazione della M5 (issue #25): comportamento PWA testabile sotto jsdom.
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { UpdateBanner } from '../../src/components/UpdateBanner'
import { YouTubePlayer } from '../../src/components/YouTubePlayer'

describe('video offline', () => {
  it('quando la miniatura non si carica mostra il placeholder «serve la connessione»', () => {
    render(<YouTubePlayer videoId="dQw4w9WgXcQ" title="Trazioni" />)

    fireEvent.error(screen.getByAltText('Anteprima video di Trazioni'))

    expect(screen.getByText('Video non disponibile senza connessione')).toBeInTheDocument()
    // Il pulsante resta: tornata la rete, il video si può avviare
    expect(screen.getByRole('button', { name: 'Riproduci il video di Trazioni' })).toBeEnabled()
  })
})

describe('banner di aggiornamento', () => {
  it('senza una nuova versione in attesa non compare nulla', () => {
    const { container } = render(<UpdateBanner />)
    expect(container).toBeEmptyDOMElement()
  })
})
