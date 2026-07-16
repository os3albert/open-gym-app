// Test di integrazione della Home (M16): weekly progress e giorni della scheda attiva,
// col click sul giorno che apre l'allenamento CON quel giorno già scelto.
import '@testing-library/jest-dom/vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../src/App'
import { recordSet } from '../../src/domain/activity'
import { addExercise } from '../../src/domain/exercises'
import { addDay, addEntry, createPlan, setActivePlan } from '../../src/domain/plans'
import type { AppData } from '../../src/domain/types'
import { emptyData, saveData } from '../../src/services/storage'
import { todayIso } from '../../src/utils/date'

beforeEach(() => {
  localStorage.clear()
  window.history.replaceState(null, '', '/')
})

/** Scheda attiva a giorni GENERICI (il calendario non decide) e una sessione di oggi. */
function seedPlanWithGenericDays(): AppData {
  let data = emptyData()
  data = addExercise(data, {
    name: 'Panca piana',
    description: '',
    youtubeUrl: 'https://youtu.be/AAAAAAAAAA0',
    muscleGroup: 'chest',
    difficulty: 'medium',
  })
  data = addExercise(data, {
    name: 'Squat',
    description: '',
    youtubeUrl: 'https://youtu.be/AAAAAAAAAA1',
    muscleGroup: 'legs',
    difficulty: 'medium',
  })
  data = createPlan(data, 'Push Pull Legs')
  const planId = data.plans[0].id
  data = addDay(data, planId, 'Giorno A')
  data = addEntry(data, planId, 'Giorno A', { exerciseId: data.exercises[0].id, sets: 3, reps: 8 })
  data = addDay(data, planId, 'Giorno B')
  data = addEntry(data, planId, 'Giorno B', { exerciseId: data.exercises[1].id, sets: 5, reps: 5 })
  data = recordSet(data, data.exercises[0].id, todayIso(), { weightKg: 80, reps: 8 })
  return setActivePlan(data, planId)
}

it('la Home mostra la settimana e i giorni della scheda; il click apre QUEL giorno', async () => {
  const user = userEvent.setup()
  saveData(seedPlanWithGenericDays())
  render(<App />)

  // Il progresso settimanale c'è: oggi 80×8 = volume 640
  expect(
    screen.getByRole('img', {
      name: 'Progresso della settimana: 1 giorno di allenamento, volume totale 640 kg×reps',
    }),
  ).toBeInTheDocument()

  // I giorni della scheda attiva, con nomi degli esercizi e conteggio
  const giornoB = screen.getByRole('heading', { name: 'Giorno B' }).closest('[data-cy=home-day]')!
  expect(within(giornoB as HTMLElement).getByText('Squat')).toBeInTheDocument()
  expect(within(giornoB as HTMLElement).getByText('1 esercizio')).toBeInTheDocument()

  // Il click porta all'allenamento CON il Giorno B già scelto (?giorno=)
  await user.click(screen.getByRole('button', { name: "Apri l'allenamento di Giorno B" }))
  expect(screen.getByRole('heading', { name: 'Squat' })).toBeInTheDocument()
  expect(screen.getByText(/Giorno B — spunta gli esercizi/)).toBeInTheDocument()
  expect(window.location.search).toContain('giorno=Giorno')
  expect(window.location.search).toContain('vista=allenamento')
})

it('senza scheda attiva la Home lo dice e porta alle Schede', async () => {
  const user = userEvent.setup()
  render(<App />)

  expect(screen.getByText(/questa settimana non hai ancora registrato/i)).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Vai alle schede' }))
  expect(screen.getByRole('heading', { name: 'Le mie schede' })).toBeInTheDocument()
})

it('il giorno scelto vince sul calendario, e «Giorno di oggi» ci riporta (M16)', async () => {
  // Scheda con IL giorno della settimana di oggi e un giorno generico
  const user = userEvent.setup()
  let data = seedPlanWithGenericDays()
  const oggi = new Intl.DateTimeFormat('it-IT', { weekday: 'long' })
    .format(new Date())
    .replace(/^./, (c) => c.toUpperCase())
  data = addDay(data, data.plans[0].id, oggi)
  data = addEntry(data, data.plans[0].id, oggi, {
    exerciseId: data.exercises[0].id,
    sets: 2,
    reps: 10,
  })
  saveData(data)
  render(<App />)

  // Dalla Home si apre il Giorno B anche se oggi è un giorno di calendario
  await user.click(screen.getByRole('button', { name: "Apri l'allenamento di Giorno B" }))
  expect(screen.getByText(/Giorno B — spunta gli esercizi/)).toBeInTheDocument()

  // «Giorno di oggi» azzera la scelta: torna il giorno del calendario
  const select = screen.getByLabelText('Che giorno della scheda fai oggi?')
  await user.click(select)
  const listbox = await screen.findByRole('listbox')
  await user.click(within(listbox).getByRole('option', { name: 'Giorno di oggi' }))
  expect(screen.getByText(new RegExp(`${oggi} — spunta gli esercizi`))).toBeInTheDocument()
  expect(window.location.search).not.toContain('giorno=')
})
