// Test di integrazione della M3: registrazione sessione, suggerimento del carico, storico.
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../src/App'
import { INVALID_SET_ERROR, recordSet } from '../../src/domain/activity'
import { it as itDict } from '../../src/i18n/it'
import { addExercise } from '../../src/domain/exercises'
import { addDay, addEntry, createPlan, setActivePlan } from '../../src/domain/plans'
import type { AppData } from '../../src/domain/types'
import { emptyData, saveData } from '../../src/services/storage'
import { addDaysIso, todayIso, weekdayNameIt } from '../../src/utils/date'
import { digitaNumero, scegliNumero, scegliOpzione } from './helpers'

beforeEach(() => {
  localStorage.clear()
  window.history.replaceState(null, '', '/')
})

/** Prepara un esercizio (con eventuale storico di ieri) direttamente in localStorage. */
function seed(options: { history?: { weightKg: number; reps: number } } = {}): AppData {
  let data = addExercise(emptyData(), {
    name: 'Squat',
    description: '',
    youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
    muscleGroup: 'legs',
    difficulty: 'medium',
    faceBlurConfirmed: true,
  })
  if (options.history) {
    data = recordSet(data, data.exercises[0].id, addDaysIso(todayIso(), -1), options.history)
  }
  saveData(data)
  return data
}

async function openTraining(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Allenamento' }))
}

describe('suggerimento del carico (issue #16)', () => {
  it("precompila peso e ripetizioni dall'ultima sessione", async () => {
    const user = userEvent.setup()
    seed({ history: { weightKg: 80, reps: 5 } }) // reps < 8: si consolida lo stesso peso
    render(<App />)
    await openTraining(user)

    await scegliOpzione(user, 'Esercizio', 'Squat')

    expect(screen.getByLabelText('Peso (kg)')).toHaveValue('80')
    expect(screen.getByLabelText('Ripetizioni')).toHaveValue('5')
  })

  it("propone la progressione se l'ultima sessione ha raggiunto le ripetizioni obiettivo", async () => {
    const user = userEvent.setup()
    seed({ history: { weightKg: 80, reps: 8 } })
    render(<App />)
    await openTraining(user)

    await scegliOpzione(user, 'Esercizio', 'Squat')

    expect(screen.getByLabelText('Peso (kg)')).toHaveValue('82.5')
  })

  it('senza storico i campi restano vuoti', async () => {
    const user = userEvent.setup()
    seed()
    render(<App />)
    await openTraining(user)

    await scegliOpzione(user, 'Esercizio', 'Squat')

    expect(screen.getByLabelText('Peso (kg)')).toHaveValue('')
    expect(screen.getByLabelText('Ripetizioni')).toHaveValue('')
  })
})

describe('registrazione della sessione (issue #14)', () => {
  it('registra serie con pesi diversi e le mostra; sopravvivono al remount', async () => {
    const user = userEvent.setup()
    seed()
    const first = render(<App />)
    await openTraining(user)

    await scegliOpzione(user, 'Esercizio', 'Squat')
    await scegliNumero(user, 'Peso (kg)', '60')
    await scegliNumero(user, 'Ripetizioni', '8')
    await user.click(screen.getByRole('button', { name: 'Aggiungi serie' }))

    await scegliNumero(user, 'Peso (kg)', '65')
    await user.click(screen.getByRole('button', { name: 'Aggiungi serie' }))

    expect(screen.getByText('60 kg × 8')).toBeInTheDocument()
    expect(screen.getByText('65 kg × 8')).toBeInTheDocument()

    first.unmount()
    render(<App />)
    await openTraining(user)
    expect(screen.getByText('60 kg × 8')).toBeInTheDocument()
  })

  it('lo spinner propone i valori plausibili e accetta i fuori scala (M14)', async () => {
    const user = userEvent.setup()
    seed()
    render(<App />)
    await openTraining(user)
    await scegliOpzione(user, 'Esercizio', 'Squat')

    // Si sceglie dalla rotella dello spinner…
    await scegliNumero(user, 'Peso (kg)', '82.5')
    expect(screen.getByLabelText('Peso (kg)')).toHaveValue('82.5')

    // …ma dentro il modale si può anche scrivere: un 317 kg non sta in nessuna rotella
    await digitaNumero(user, 'Peso (kg)', '317')
    expect(screen.getByLabelText('Peso (kg)')).toHaveValue('317')
  })

  it("rifiuta una serie non valida mostrando l'errore", async () => {
    const user = userEvent.setup()
    seed()
    render(<App />)
    await openTraining(user)
    await scegliOpzione(user, 'Esercizio', 'Squat')

    // Solo il peso: senza ripetizioni la serie non è valida
    await scegliNumero(user, 'Peso (kg)', '60')
    await user.click(await screen.findByRole('button', { name: 'Aggiungi serie' }))

    // Il dominio lancia il CODICE, l'interfaccia mostra la frase: qui si asserisce ciò che l'utente legge
    expect(screen.getByRole('alert')).toHaveTextContent(itDict[`errors.${INVALID_SET_ERROR}`])
  })

  it('una serie si può rimuovere', async () => {
    const user = userEvent.setup()
    seed()
    render(<App />)
    await openTraining(user)
    await scegliOpzione(user, 'Esercizio', 'Squat')
    await scegliNumero(user, 'Peso (kg)', '60')
    await scegliNumero(user, 'Ripetizioni', '8')
    await user.click(screen.getByRole('button', { name: 'Aggiungi serie' }))

    await user.click(screen.getByRole('button', { name: /Rimuovi la serie 60 kg × 8/ }))
    expect(screen.queryByText('60 kg × 8')).not.toBeInTheDocument()
  })
})

describe('i controlli del grafico sotto il carosello (M18, era lo Storico)', () => {
  /** Scheda attiva con lo Squat previsto oggi: il carosello è dove vivono i grafici ora. */
  function seedPlanWithHistory(): AppData {
    // Ieri 80 kg × 5; oggi due serie: 85×5 e 85×3 (8 reps totali, 680 kg×reps)
    let data = seed({ history: { weightKg: 80, reps: 5 } })
    data = recordSet(data, data.exercises[0].id, todayIso(), { weightKg: 85, reps: 5 })
    data = recordSet(data, data.exercises[0].id, todayIso(), { weightKg: 85, reps: 3 })
    data = createPlan(data, 'Full Body')
    const oggi = weekdayNameIt(todayIso())
    data = addDay(data, data.plans[0].id, oggi)
    data = addEntry(data, data.plans[0].id, oggi, {
      exerciseId: data.exercises[0].id,
      sets: 3,
      reps: 8,
    })
    data = setActivePlan(data, data.plans[0].id)
    saveData(data)
    return data
  }

  it('di default le card mostrano peso e ripetizioni insieme; la metrica le cambia TUTTE', async () => {
    const user = userEvent.setup()
    seedPlanWithHistory()
    render(<App />)
    await openTraining(user)

    // Default: il grafico doppio, senza scegliere nessun esercizio
    expect(screen.getByRole('img', { name: /Andamento di peso e ripetizioni/ })).toBeInTheDocument()

    // La metrica singola porta nel carosello il grafico (e il contratto) dello Storico
    await scegliOpzione(user, 'Metrica', 'Peso massimo')
    expect(
      screen.getByRole('img', { name: /Andamento del carico: da 80 kg .* a 85 kg/ }),
    ).toBeInTheDocument()

    await scegliOpzione(user, 'Metrica', 'Ripetizioni totali')
    expect(
      screen.getByRole('img', {
        name: /Andamento delle ripetizioni totali: da 5 reps .* a 8 reps/,
      }),
    ).toBeInTheDocument()

    await scegliOpzione(user, 'Metrica', 'Ripetizioni massime')
    expect(
      screen.getByRole('img', {
        name: /Andamento delle ripetizioni massime: da 5 reps .* a 5 reps/,
      }),
    ).toBeInTheDocument()

    await scegliOpzione(user, 'Metrica', 'Volume (kg × reps)')
    expect(
      screen.getByRole('img', { name: /Andamento del volume: da 400 kg×reps .* a 680 kg×reps/ }),
    ).toBeInTheDocument()

    // E si torna al default
    await scegliOpzione(user, 'Metrica', 'Peso e ripetizioni')
    expect(screen.getByRole('img', { name: /Andamento di peso e ripetizioni/ })).toBeInTheDocument()
  })

  it('il periodo taglia i punti: «Tutto lo storico» li riprende', async () => {
    const user = userEvent.setup()
    // La sessione vecchia è fuori dagli ultimi 30 giorni
    let data = seed()
    data = recordSet(data, data.exercises[0].id, addDaysIso(todayIso(), -60), {
      weightKg: 70,
      reps: 8,
    })
    data = recordSet(data, data.exercises[0].id, todayIso(), { weightKg: 85, reps: 5 })
    data = createPlan(data, 'Full Body')
    const oggi = weekdayNameIt(todayIso())
    data = addDay(data, data.plans[0].id, oggi)
    data = addEntry(data, data.plans[0].id, oggi, {
      exerciseId: data.exercises[0].id,
      sets: 3,
      reps: 8,
    })
    saveData(setActivePlan(data, data.plans[0].id))
    render(<App />)
    await openTraining(user)
    await scegliOpzione(user, 'Metrica', 'Peso massimo')

    // Ultimi 30 giorni (default): solo il punto di oggi
    expect(
      screen.getByRole('img', { name: /Andamento del carico: da 85 kg .* a 85 kg/ }),
    ).toBeInTheDocument()

    await scegliOpzione(user, 'Periodo', 'Tutto lo storico')
    expect(
      screen.getByRole('img', { name: /Andamento del carico: da 70 kg .* a 85 kg/ }),
    ).toBeInTheDocument()
  })

  it("la vista Storico non esiste più: la tab non c'è", () => {
    seed()
    render(<App />)
    expect(screen.queryByRole('button', { name: 'Storico' })).not.toBeInTheDocument()
  })
})
