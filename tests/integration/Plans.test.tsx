// Test di integrazione della M4: schede per giorni, allenamento del giorno, condivisione.
import '@testing-library/jest-dom/vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../src/App'
import { it as itDict } from '../../src/i18n/it'
import { recordSet } from '../../src/domain/activity'
import { addExercise } from '../../src/domain/exercises'
import { addDay, addEntry, createPlan, setActivePlan } from '../../src/domain/plans'
import type { AppData } from '../../src/domain/types'
import { INVALID_SHARE_CODE_ERROR } from '../../src/services/share'
import { emptyData, saveData } from '../../src/services/storage'
import { addDaysIso, todayIso, weekdayNameIt } from '../../src/utils/date'
import { digitaGiorno, scegliGiorno, scegliOpzione } from './helpers'

beforeEach(() => {
  localStorage.clear()
  window.history.replaceState(null, '', '/')
})

function withExercises(...names: string[]): AppData {
  let data = emptyData()
  names.forEach((name, i) => {
    data = addExercise(data, {
      name,
      description: '',
      youtubeUrl: `https://youtu.be/AAAAAAAAAA${i}`,
      muscleGroup: 'legs',
      difficulty: 'medium',
      faceBlurConfirmed: true,
    })
  })
  return data
}

async function openTab(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.click(screen.getByRole('button', { name: label }))
}

describe('creazione e gestione delle schede (issue #18)', () => {
  it('creo la scheda, aggiungo Lunedì e «Panca piana 3×8» compare sotto Lunedì', async () => {
    const user = userEvent.setup()
    saveData(withExercises('Panca piana'))
    render(<App />)
    await openTab(user, 'Schede')

    await user.type(screen.getByLabelText('Nuova scheda'), 'Full Body 3x')
    await user.click(screen.getByRole('button', { name: 'Crea scheda' }))
    await user.click(screen.getByRole('button', { name: 'Modifica' }))

    await scegliGiorno(user, 'Lunedì')
    await user.click(screen.getByRole('button', { name: 'Aggiungi giorno' }))

    await scegliOpzione(user, 'Esercizio', 'Panca piana')
    await user.click(screen.getByRole('button', { name: 'Aggiungi' }))

    const day = screen.getByRole('heading', { name: 'Lunedì' }).closest('[data-cy=plan-day]')!
    expect(within(day as HTMLElement).getByText('Panca piana — 3×8')).toBeInTheDocument()
  })

  it('un giorno con un nome fuori lista si scrive nel modale (M15)', async () => {
    const user = userEvent.setup()
    saveData(withExercises('Panca piana'))
    render(<App />)
    await openTab(user, 'Schede')

    await user.type(screen.getByLabelText('Nuova scheda'), 'Push Pull Legs')
    await user.click(screen.getByRole('button', { name: 'Crea scheda' }))
    await user.click(screen.getByRole('button', { name: 'Modifica' }))

    // Nessuna lista può prevederlo: il campo libero del modale resta la via d'uscita
    await digitaGiorno(user, 'Petto e bicipiti')
    await user.click(screen.getByRole('button', { name: 'Aggiungi giorno' }))

    expect(screen.getByRole('heading', { name: 'Petto e bicipiti' })).toBeInTheDocument()
  })

  it("con due schede, quella attivata guida l'allenamento del giorno", async () => {
    const user = userEvent.setup()
    let data = withExercises('Squat', 'Trazioni')
    data = createPlan(data, 'Scheda A')
    data = createPlan(data, 'Scheda B')
    const oggi = weekdayNameIt(todayIso())
    data = addDay(data, data.plans[1].id, oggi)
    data = addEntry(data, data.plans[1].id, oggi, {
      exerciseId: data.exercises[1].id,
      sets: 5,
      reps: 5,
    })
    saveData(data)
    render(<App />)
    await openTab(user, 'Schede')

    // Attivo la seconda scheda (il primo pulsante «Attiva» è della prima)
    await user.click(screen.getAllByRole('button', { name: 'Attiva' })[1])
    expect(screen.getByText('✓ attiva')).toBeInTheDocument()

    await openTab(user, 'Allenamento')
    expect(screen.getByRole('heading', { name: 'La tua scheda: Scheda B' })).toBeInTheDocument()
    // Il carosello mostra l'esercizio della scheda attivata
    expect(screen.getByRole('heading', { name: 'Trazioni' })).toBeInTheDocument()
  })

  it('una scheda non attiva si elimina con conferma', async () => {
    const user = userEvent.setup()
    saveData(createPlan(emptyData(), 'Da buttare'))
    render(<App />)
    await openTab(user, 'Schede')

    await user.click(screen.getByRole('button', { name: 'Elimina' }))
    await user.click(screen.getByRole('button', { name: 'Conferma eliminazione' }))

    expect(screen.getByText(/Nessuna scheda/)).toBeInTheDocument()
  })
})

describe('allenamento del giorno (issue #19)', () => {
  /** Scheda attiva con l'allenamento previsto oggi e storico di ieri a 100 kg × 5. */
  function seedActivePlanForToday(): AppData {
    let data = withExercises('Squat')
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

  it('il carosello mostra una card per esercizio, col set log e il carico suggerito (M14)', async () => {
    const user = userEvent.setup()
    saveData(seedActivePlanForToday())
    render(<App />)
    await openTab(user, 'Allenamento')

    const card = screen.getByRole('heading', { name: 'Squat' }).closest('li, div[class*=Card]')!
    // Ieri 100 kg × 5 (sotto l'obiettivo): si ripropone lo stesso carico, reps dal target
    expect(screen.getByLabelText('Peso (kg)')).toHaveValue('100')
    expect(screen.getByLabelText('Ripetizioni')).toHaveValue('8')

    // Il set log ha una riga per ogni serie prevista dalla scheda (3×8)
    expect(within(card as HTMLElement).getAllByRole('row')).toHaveLength(4) // intestazione + 3

    // Le frecce del carosello (jsdom non fa layout: lo scorrimento vero lo copre Cypress)
    await user.click(screen.getByRole('button', { name: 'Esercizio successivo' }))
    await user.click(screen.getByRole('button', { name: 'Esercizio precedente' }))

    // La spunta della prima riga registra QUELLA serie: una riga, una serie
    await user.click(screen.getByRole('button', { name: 'Registra la serie 1 di Squat' }))

    expect(screen.getByRole('button', { name: 'Annulla la serie 1 di Squat' })).toBeInTheDocument()
    await openTab(user, 'Storico')
    expect(screen.getByText(/100 kg × 8/)).toBeInTheDocument()
  })

  it("un esercizio del catalogo mostra la GIF animata nel carosello, con l'attribuzione (M16)", async () => {
    const user = userEvent.setup()
    let data = addExercise(emptyData(), {
      name: 'Military press',
      description: 'Dal catalogo',
      youtubeUrl: '',
      gifUrl: 'https://raw.githubusercontent.com/x/y/main/videos/0001.gif',
      muscleGroup: 'shoulders',
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
    saveData(setActivePlan(data, data.plans[0].id))
    render(<App />)
    await openTab(user, 'Allenamento')

    // La GIF al posto del video, e il copyright del media ben visibile (obbligo di licenza)
    expect(
      screen.getByRole('img', { name: 'Dimostrazione animata di Military press' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /© Gym visual/ })).toHaveAttribute(
      'href',
      'https://gymvisual.com/',
    )
  })

  it('senza allenamento previsto oggi mostra il riposo con il prossimo allenamento', async () => {
    const user = userEvent.setup()
    let data = withExercises('Squat')
    data = createPlan(data, 'Solo un giorno')
    const dopodomani = weekdayNameIt(addDaysIso(todayIso(), 2))
    data = addDay(data, data.plans[0].id, dopodomani)
    saveData(setActivePlan(data, data.plans[0].id))
    render(<App />)
    await openTab(user, 'Allenamento')

    const rest = screen.getByText(/Oggi riposo/)
    expect(rest).toHaveTextContent(`Prossimo allenamento: ${dopodomani}`)
  })
})

describe('condivisione e importazione (issue #20, #21)', () => {
  /** Profilo «mittente»: scheda su due giorni con due esercizi. */
  function seedSharablePlan(): AppData {
    let data = withExercises('Trazioni', 'Squat')
    data = createPlan(data, 'Push Pull Legs')
    const planId = data.plans[0].id
    data = addDay(data, planId, 'Lunedì')
    data = addEntry(data, planId, 'Lunedì', { exerciseId: data.exercises[0].id, sets: 3, reps: 8 })
    data = addDay(data, planId, 'Giovedì')
    data = addEntry(data, planId, 'Giovedì', { exerciseId: data.exercises[1].id, sets: 5, reps: 5 })
    return data
  }

  it('la scheda condivisa si importa identica in un profilo pulito', async () => {
    const user = userEvent.setup()
    saveData(seedSharablePlan())
    const sender = render(<App />)
    await openTab(user, 'Schede')
    await user.click(screen.getByRole('button', { name: 'Condividi' }))
    const code = (screen.getByLabelText('Codice di condivisione') as HTMLTextAreaElement).value
    expect(code.length).toBeGreaterThan(0)

    // Cambio «dispositivo»: profilo completamente vuoto
    sender.unmount()
    localStorage.clear()
    window.history.replaceState(null, '', '/')
    render(<App />)
    await openTab(user, 'Schede')

    await user.click(screen.getByLabelText('Codice ricevuto'))
    await user.paste(code)
    await user.click(screen.getByRole('button', { name: 'Anteprima' }))

    expect(screen.getByRole('heading', { name: 'Scheda: Push Pull Legs' })).toBeInTheDocument()
    expect(screen.getByText('Trazioni — 3×8')).toBeInTheDocument()
    expect(screen.getByText('Squat — 5×5')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Aggiungi ai miei' }))
    expect(screen.getByText('Scheda aggiunta alle tue!')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Push Pull Legs' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Prova questa scheda' }))
    expect(screen.getByText('✓ attiva')).toBeInTheDocument()
  })

  it('un codice non valido è rifiutato senza toccare i dati', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openTab(user, 'Schede')

    await user.click(screen.getByLabelText('Codice ricevuto'))
    await user.paste('questo-non-e-un-codice')
    await user.click(screen.getByRole('button', { name: 'Anteprima' }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      itDict[`errors.${INVALID_SHARE_CODE_ERROR}`],
    )
    expect(screen.getByText(/Nessuna scheda/)).toBeInTheDocument()
  })

  it("un link con #dati=… apre subito l'anteprima nella vista Schede", async () => {
    saveData(seedSharablePlan())
    const sender = render(<App />)
    const user = userEvent.setup()
    await openTab(user, 'Schede')
    await user.click(screen.getByRole('button', { name: 'Condividi' }))
    const code = (screen.getByLabelText('Codice di condivisione') as HTMLTextAreaElement).value
    sender.unmount()
    localStorage.clear()

    window.history.replaceState(null, '', `/#dati=${code}`)
    render(<App />)

    // Arrivo direttamente sulla vista Schede con l'anteprima già aperta
    expect(screen.getByRole('heading', { name: 'Scheda: Push Pull Legs' })).toBeInTheDocument()
    expect(window.location.hash).toBe('')
  })
})
