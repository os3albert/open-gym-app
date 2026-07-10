// Test di integrazione UI: App reale + dominio + localStorage (jsdom), senza mock.
import '@testing-library/jest-dom'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../src/App'
import { INVALID_YOUTUBE_LINK_ERROR } from '../../src/domain/exercises'

beforeEach(() => {
  localStorage.clear()
})

async function proposeExercise(name: string, youtubeUrl: string) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Nome esercizio'), name)
  await user.type(screen.getByLabelText('Gruppo muscolare'), 'Petto')
  await user.type(screen.getByLabelText('Link YouTube (volto offuscato)'), youtubeUrl)
  await user.click(screen.getByRole('button', { name: 'Proponi esercizio' }))
}

describe('App', () => {
  it('propone un esercizio e lo mostra in elenco', async () => {
    render(<App />)
    await proposeExercise('Panca piana', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')

    expect(screen.getByRole('heading', { name: 'Panca piana' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it("mostra l'errore e non salva nulla con un link non YouTube", async () => {
    render(<App />)
    await proposeExercise('Squat', 'https://vimeo.com/12345')

    expect(screen.getByRole('alert')).toHaveTextContent(INVALID_YOUTUBE_LINK_ERROR)
    expect(screen.queryByRole('heading', { name: 'Squat' })).not.toBeInTheDocument()
  })

  it("l'upvote incrementa il contatore dei voti", async () => {
    const user = userEvent.setup()
    render(<App />)
    await proposeExercise('Trazioni', 'https://youtu.be/dQw4w9WgXcQ')

    const item = screen.getByRole('listitem')
    await user.click(within(item).getByRole('button', { name: 'Vota Trazioni' }))

    expect(within(item).getByText('1')).toBeInTheDocument()
  })

  it('i dati sopravvivono a uno smontaggio e rimontaggio (persistenza localStorage)', async () => {
    const first = render(<App />)
    await proposeExercise('Affondi', 'https://youtu.be/dQw4w9WgXcQ')
    first.unmount()

    render(<App />)
    expect(screen.getByRole('heading', { name: 'Affondi' })).toBeInTheDocument()
  })
})
