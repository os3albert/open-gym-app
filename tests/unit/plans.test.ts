import { expect } from 'chai'
import { EXERCISE_NOT_FOUND_ERROR } from '../../src/domain/activity'
import { addExercise, deleteExercise } from '../../src/domain/exercises'
import {
  activePlan,
  addDay,
  addEntry,
  createPlan,
  DAY_NOT_FOUND_ERROR,
  dayForDate,
  deletePlan,
  DUPLICATE_DAY_NAME_ERROR,
  DUPLICATE_ENTRY_ERROR,
  EMPTY_DAY_NAME_ERROR,
  EMPTY_PLAN_NAME_ERROR,
  INVALID_TARGET_ERROR,
  moveEntry,
  nextScheduledDay,
  PLAN_NOT_FOUND_ERROR,
  planUsesWeekdays,
  removeDay,
  removeEntry,
  renamePlan,
  setActivePlan,
} from '../../src/domain/plans'
import type { AppData } from '../../src/domain/types'
import { emptyData } from '../../src/services/storage'

// 2026-07-06 è un lunedì, 2026-07-11 un sabato: date fisse per test deterministici
const LUNEDI = '2026-07-06'
const SABATO = '2026-07-11'

function dataWithExercises(...names: string[]): AppData {
  let data = emptyData()
  names.forEach((name, i) => {
    data = addExercise(data, {
      name,
      description: '',
      youtubeUrl: `https://youtu.be/AAAAAAAAAA${i}`,
      muscleGroup: 'Gambe',
      difficulty: 'medium',
      faceBlurConfirmed: true,
    })
  })
  return data
}

/** Scheda "Full Body" con il giorno Lunedì e l'esercizio in posizione 0 a 3×8. */
function dataWithPlan(): AppData {
  let data = dataWithExercises('Squat', 'Panca piana')
  data = createPlan(data, 'Full Body')
  data = addDay(data, data.plans[0].id, 'Lunedì')
  data = addEntry(data, data.plans[0].id, 'Lunedì', {
    exerciseId: data.exercises[0].id,
    sets: 3,
    reps: 8,
  })
  return data
}

describe('CRUD delle schede (issue #18)', () => {
  it('crea una scheda vuota con il nome ripulito', () => {
    const data = createPlan(emptyData(), '  Full Body 3x  ')
    expect(data.plans).to.have.lengthOf(1)
    expect(data.plans[0].name).to.equal('Full Body 3x')
    expect(data.plans[0].days).to.deep.equal([])
  })

  it('rifiuta una scheda senza nome', () => {
    expect(() => createPlan(emptyData(), '   ')).to.throw(EMPTY_PLAN_NAME_ERROR)
  })

  it('rinomina una scheda esistente', () => {
    const data = createPlan(emptyData(), 'Vecchio nome')
    const renamed = renamePlan(data, data.plans[0].id, 'Push Pull Legs')
    expect(renamed.plans[0].name).to.equal('Push Pull Legs')
  })

  it('rinominare una scheda inesistente è un errore', () => {
    expect(() => renamePlan(emptyData(), 'manca', 'X')).to.throw(PLAN_NOT_FOUND_ERROR)
  })

  it("l'eliminazione della scheda attiva azzera la scheda attiva", () => {
    let data = createPlan(emptyData(), 'Da eliminare')
    data = setActivePlan(data, data.plans[0].id)
    const after = deletePlan(data, data.plans[0].id)
    expect(after.plans).to.have.lengthOf(0)
    expect(after.activePlanId).to.equal(null)
  })

  it("l'eliminazione di una scheda non attiva preserva quella attiva", () => {
    let data = createPlan(createPlan(emptyData(), 'Attiva'), 'Altra')
    data = setActivePlan(data, data.plans[0].id)
    const after = deletePlan(data, data.plans[1].id)
    expect(after.activePlanId).to.equal(data.plans[0].id)
  })
})

describe('scheda attiva', () => {
  it('imposta e legge la scheda attiva', () => {
    let data = createPlan(emptyData(), 'La mia scheda')
    data = setActivePlan(data, data.plans[0].id)
    expect(activePlan(data)?.name).to.equal('La mia scheda')
  })

  it('attivare una scheda inesistente è un errore', () => {
    expect(() => setActivePlan(emptyData(), 'manca')).to.throw(PLAN_NOT_FOUND_ERROR)
  })

  it('null disattiva la scheda corrente', () => {
    let data = createPlan(emptyData(), 'Scheda')
    data = setActivePlan(data, data.plans[0].id)
    expect(activePlan(setActivePlan(data, null))).to.equal(null)
  })
})

describe('giorni ed esercizi della scheda (issue #18)', () => {
  it('aggiunge un giorno e un esercizio con target: «Panca piana 3x8 sotto Lunedì»', () => {
    const data = dataWithPlan()
    const day = data.plans[0].days[0]
    expect(day.name).to.equal('Lunedì')
    expect(day.entries).to.deep.equal([{ exerciseId: data.exercises[0].id, sets: 3, reps: 8 }])
  })

  it('rifiuta un giorno senza nome o con nome già usato (anche con maiuscole diverse)', () => {
    const data = dataWithPlan()
    expect(() => addDay(data, data.plans[0].id, '  ')).to.throw(EMPTY_DAY_NAME_ERROR)
    expect(() => addDay(data, data.plans[0].id, 'lunedì')).to.throw(DUPLICATE_DAY_NAME_ERROR)
  })

  it('rimuove un giorno con tutti i suoi esercizi', () => {
    const data = dataWithPlan()
    const after = removeDay(data, data.plans[0].id, 'Lunedì')
    expect(after.plans[0].days).to.have.lengthOf(0)
  })

  it('rifiuta un target non valido (zero serie, ripetizioni non intere)', () => {
    const data = dataWithPlan()
    const planId = data.plans[0].id
    const exerciseId = data.exercises[1].id
    expect(() => addEntry(data, planId, 'Lunedì', { exerciseId, sets: 0, reps: 8 })).to.throw(
      INVALID_TARGET_ERROR,
    )
    expect(() => addEntry(data, planId, 'Lunedì', { exerciseId, sets: 3, reps: 8.5 })).to.throw(
      INVALID_TARGET_ERROR,
    )
  })

  it('rifiuta un esercizio inesistente o già previsto nel giorno', () => {
    const data = dataWithPlan()
    const planId = data.plans[0].id
    expect(() =>
      addEntry(data, planId, 'Lunedì', { exerciseId: 'manca', sets: 3, reps: 8 }),
    ).to.throw(EXERCISE_NOT_FOUND_ERROR)
    expect(() =>
      addEntry(data, planId, 'Lunedì', { exerciseId: data.exercises[0].id, sets: 3, reps: 8 }),
    ).to.throw(DUPLICATE_ENTRY_ERROR)
  })

  it('rifiuta un giorno che non esiste nella scheda', () => {
    const data = dataWithPlan()
    expect(() =>
      addEntry(data, data.plans[0].id, 'Venerdì', {
        exerciseId: data.exercises[1].id,
        sets: 3,
        reps: 8,
      }),
    ).to.throw(DAY_NOT_FOUND_ERROR)
  })

  it('rimuove un esercizio dal giorno', () => {
    const data = dataWithPlan()
    const after = removeEntry(data, data.plans[0].id, 'Lunedì', data.exercises[0].id)
    expect(after.plans[0].days[0].entries).to.have.lengthOf(0)
  })

  it('riordina gli esercizi del giorno; ai bordi non cambia nulla', () => {
    let data = dataWithPlan()
    const planId = data.plans[0].id
    data = addEntry(data, planId, 'Lunedì', { exerciseId: data.exercises[1].id, sets: 4, reps: 6 })

    const moved = moveEntry(data, planId, 'Lunedì', data.exercises[1].id, -1)
    expect(moved.plans[0].days[0].entries.map((e) => e.exerciseId)).to.deep.equal([
      data.exercises[1].id,
      data.exercises[0].id,
    ])

    const unchanged = moveEntry(data, planId, 'Lunedì', data.exercises[0].id, -1)
    expect(unchanged.plans[0].days[0].entries).to.deep.equal(data.plans[0].days[0].entries)
  })

  it('eliminare un esercizio lo rimuove anche dai giorni delle schede', () => {
    const data = dataWithPlan()
    const after = deleteExercise(data, data.exercises[0].id)
    expect(after.plans[0].days[0].entries).to.have.lengthOf(0)
  })
})

describe('allenamento del giorno (issue #19)', () => {
  it('trova il giorno di scheda che corrisponde al giorno della settimana', () => {
    const data = dataWithPlan()
    const day = dayForDate(data.plans[0], LUNEDI)
    expect(day?.name).to.equal('Lunedì')
  })

  it('il match sul giorno della settimana ignora le maiuscole', () => {
    let data = dataWithExercises('Squat')
    data = createPlan(data, 'Scheda')
    data = addDay(data, data.plans[0].id, 'lunedì')
    expect(dayForDate(data.plans[0], LUNEDI)?.name).to.equal('lunedì')
  })

  it('un sabato senza giorno in scheda è riposo (nessun match)', () => {
    const data = dataWithPlan()
    expect(dayForDate(data.plans[0], SABATO)).to.equal(null)
  })

  it('il prossimo allenamento previsto dopo sabato è il lunedì successivo', () => {
    const data = dataWithPlan()
    const next = nextScheduledDay(data.plans[0], SABATO)
    expect(next?.day.name).to.equal('Lunedì')
    expect(next?.date).to.equal('2026-07-13')
  })

  it('riconosce le schede a giorni generici (Giorno A/B/C)', () => {
    let data = dataWithExercises('Squat')
    data = createPlan(data, 'Generica')
    data = addDay(data, data.plans[0].id, 'Giorno A')
    expect(planUsesWeekdays(data.plans[0])).to.equal(false)
    expect(dayForDate(data.plans[0], LUNEDI)).to.equal(null)
    expect(nextScheduledDay(data.plans[0], LUNEDI)).to.equal(null)
    expect(planUsesWeekdays(dataWithPlan().plans[0])).to.equal(true)
  })
})
