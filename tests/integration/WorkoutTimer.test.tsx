// Test di integrazione del timer di allenamento (M14): il FAB avvia la sessione,
// registrare una serie fa partire la pausa da sola, un tocco la chiude, lo stop azzera.
import '@testing-library/jest-dom/vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../src/App'
import { recordSet } from '../../src/domain/activity'
import { addExercise } from '../../src/domain/exercises'
import { addDay, addEntry, createPlan, setActivePlan } from '../../src/domain/plans'
import type { AppData } from '../../src/domain/types'
import { emptyData, saveData } from '../../src/services/storage'
import { addDaysIso, todayIso, weekdayNameIt } from '../../src/utils/date'

beforeEach(() => {
  localStorage.clear()
  window.history.replaceState(null, '', '/')
  // SOLO l'orologio del timer: setTimeout resta vero, o gli attesi interni di
  // userEvent e React non scadono mai e il test va in timeout.
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] })
})

afterEach(() => {
  vi.useRealTimers()
})

/** Scheda attiva con lo Squat previsto oggi (come in Plans.test) e una serie di ieri. */
function seedActivePlanForToday(): AppData {
  let data = emptyData()
  data = addExercise(data, {
    name: 'Squat',
    description: '',
    youtubeUrl: 'https://youtu.be/AAAAAAAAAA0',
    muscleGroup: 'legs',
    difficulty: 'medium',
    faceBlurConfirmed: true,
  })
  data = recordSet(data, data.exercises[0].id, addDaysIso(todayIso(), -1), {
    weightKg: 100,
    reps: 5,
  })
  data = createPlan(data, 'Full Body')
  const oggi = weekdayNameIt(todayIso())
  data = addDay(data, data.plans[0].id, oggi)
  data = addEntry(data, data.plans[0].id, oggi, {
    exerciseId: data.exercises[0].id,
    sets: 3,
    reps: 8,
  })
  return setActivePlan(data, data.plans[0].id)
}

it('il FAB avvia il timer, la serie registrata fa partire la pausa, un tocco la chiude', async () => {
  const user = userEvent.setup()
  saveData(seedActivePlanForToday())
  render(<App />)
  await user.click(screen.getByRole('button', { name: 'Allenamento' }))

  // Da fermo: il FAB dice solo «Timer» e lo stop non esiste
  const fab = screen.getByRole('button', { name: 'Timer' })
  expect(fab).toHaveTextContent('Timer')
  expect(screen.queryByRole('button', { name: 'Ferma il timer' })).not.toBeInTheDocument()

  // Avvio: parte il tempo di esercizio, che avanza col passare dei secondi
  await user.click(fab)
  act(() => {
    vi.advanceTimersByTime(65_000)
  })
  expect(fab).toHaveTextContent('Esercizio 1:05')

  // Registrata una serie, la pausa parte DA SOLA e conta da zero
  await user.click(screen.getByRole('button', { name: 'Registra la serie 1 di Squat' }))
  act(() => {
    vi.advanceTimersByTime(30_000)
  })
  expect(fab).toHaveTextContent('Pausa 0:30')

  // Un tocco chiude la pausa: si torna al tempo totale della sessione
  await user.click(fab)
  expect(fab).toHaveTextContent('Esercizio 1:35')

  // Lo stop riporta tutto a riposo
  await user.click(screen.getByRole('button', { name: 'Ferma il timer' }))
  expect(fab).toHaveTextContent('Timer')
  expect(screen.queryByRole('button', { name: 'Ferma il timer' })).not.toBeInTheDocument()
})

it('senza timer avviato, registrare una serie non fa partire nulla', async () => {
  const user = userEvent.setup()
  saveData(seedActivePlanForToday())
  render(<App />)
  await user.click(screen.getByRole('button', { name: 'Allenamento' }))

  await user.click(screen.getByRole('button', { name: 'Registra la serie 1 di Squat' }))
  expect(screen.getByRole('button', { name: 'Timer' })).toHaveTextContent('Timer')
  expect(screen.queryByRole('button', { name: 'Ferma il timer' })).not.toBeInTheDocument()
})
