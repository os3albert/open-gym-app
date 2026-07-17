// Test di integrazione delle bozze del set log (M17): spuntare non tocca lo storico,
// la conferma è un gesto esplicito, e nessuna bozza si perde — né al reload né a cavallo
// dei giorni.
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../src/App'
import { addExercise } from '../../src/domain/exercises'
import { addDay, addEntry, createPlan, setActivePlan } from '../../src/domain/plans'
import type { AppData } from '../../src/domain/types'
import { emptyData, saveData } from '../../src/services/storage'
import { addDaysIso, todayIso, weekdayNameIt } from '../../src/utils/date'

const DRAFTS_KEY = 'open-gym-app/bozze-serie'
const DATA_KEY = 'open-gym-app/data'

beforeEach(() => {
  localStorage.clear()
  window.history.replaceState(null, '', '/?vista=allenamento')
})

function seedPlanForToday(): AppData {
  let data = addExercise(emptyData(), {
    name: 'Squat',
    description: '',
    youtubeUrl: 'https://youtu.be/AAAAAAAAAA0',
    muscleGroup: 'legs',
    difficulty: 'medium',
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

function activitySalvata(): unknown[] {
  return (JSON.parse(localStorage.getItem(DATA_KEY)!) as AppData).activity
}

it('le serie spuntate sono bozze: sopravvivono al reload e lo storico resta intatto', async () => {
  const user = userEvent.setup()
  saveData(seedPlanForToday())
  const first = render(<App />)

  await user.click(screen.getByRole('button', { name: 'Registra la serie 1 di Squat' }))
  await user.click(screen.getByRole('button', { name: 'Registra la serie 2 di Squat' }))

  // Due bozze in vista, storico ancora VUOTO: spuntare non salva
  expect(
    screen.getByRole('button', { name: 'Togli dalla bozza la serie 1 di Squat' }),
  ).toBeVisible()
  expect(activitySalvata()).toHaveLength(0)

  // «Ricaricamento»: in palestra il telefono si chiude di continuo, la bozza deve esserci ancora
  first.unmount()
  render(<App />)
  expect(
    screen.getByRole('button', { name: 'Togli dalla bozza la serie 2 di Squat' }),
  ).toBeInTheDocument()

  // La conferma è il gesto che tocca lo storico
  await user.click(screen.getByRole('button', { name: 'Conferma 2 serie nello storico' }))
  expect(screen.getByRole('button', { name: 'Annulla la serie 1 di Squat' })).toBeInTheDocument()
  expect(activitySalvata()).toHaveLength(1)
})

it('togliere una bozza non tocca nulla; la conferma sparisce quando non ci sono bozze', async () => {
  const user = userEvent.setup()
  saveData(seedPlanForToday())
  render(<App />)

  await user.click(screen.getByRole('button', { name: 'Registra la serie 1 di Squat' }))
  await user.click(screen.getByRole('button', { name: 'Togli dalla bozza la serie 1 di Squat' }))

  expect(
    screen.queryByRole('button', { name: /Conferma .* nello storico/ }),
  ).not.toBeInTheDocument()
  expect(activitySalvata()).toHaveLength(0)
})

describe('bozze rimaste da un giorno passato', () => {
  function seedWithPendingYesterday(): string {
    const data = seedPlanForToday()
    saveData(data)
    const ieri = addDaysIso(todayIso(), -1)
    localStorage.setItem(
      DRAFTS_KEY,
      JSON.stringify({ [ieri]: { [data.exercises[0].id]: [{ weightKg: 100, reps: 5 }] } }),
    )
    return ieri
  }

  it('il banner le salva nello storico DEL LORO giorno', async () => {
    const user = userEvent.setup()
    const ieri = seedWithPendingYesterday()
    render(<App />)

    expect(screen.getByRole('status')).toHaveTextContent(/1 serie del .* spuntata ma non salvata/)
    await user.click(screen.getByRole('button', { name: 'Salva nello storico' }))

    const activity = activitySalvata() as Array<{ date: string; sets: unknown[] }>
    expect(activity).toHaveLength(1)
    expect(activity[0].date).toBe(ieri)
    expect(screen.queryByText(/spuntata ma non salvata/)).not.toBeInTheDocument()
  })

  it('«Scarta» le elimina senza toccare lo storico', async () => {
    const user = userEvent.setup()
    seedWithPendingYesterday()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Scarta' }))

    expect(activitySalvata()).toHaveLength(0)
    expect(screen.queryByText(/spuntata ma non salvata/)).not.toBeInTheDocument()
  })
})
