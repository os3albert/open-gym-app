import { Given, Then, When } from '@cucumber/cucumber'
import { expect } from 'chai'
import { addExercise } from '../../src/domain/exercises'
import {
  activePlan,
  addDay,
  addEntry,
  createPlan,
  dayForDate,
  deletePlan,
  nextScheduledDay,
  setActivePlan,
} from '../../src/domain/plans'
import type { AppData, WorkoutPlan } from '../../src/domain/types'
import { applySharedPayload, decodeShare, encodePlanShare } from '../../src/services/share'
import { emptyData } from '../../src/services/storage'
import type { GymWorld } from '../support/world'

/** Video deterministico per nome: lo stesso esercizio ha lo stesso video su ogni dispositivo. */
function videoIdFor(name: string): string {
  return name
    .replace(/[^A-Za-z0-9_-]/g, '')
    .padEnd(11, 'x')
    .slice(0, 11)
}

function ensureExercise(data: AppData, name: string): { data: AppData; exerciseId: string } {
  const existing = data.exercises.find((e) => e.name === name)
  if (existing) return { data, exerciseId: existing.id }
  const next = addExercise(data, {
    name,
    description: '',
    youtubeUrl: `https://youtu.be/${videoIdFor(name)}`,
    muscleGroup: '',
    faceBlurConfirmed: true,
  })
  return { data: next, exerciseId: next.exercises[next.exercises.length - 1].id }
}

function findPlan(data: AppData, name: string): WorkoutPlan {
  const plan = data.plans.find((p) => p.name === name)
  expect(plan, `nessuna scheda "${name}"`).to.not.equal(undefined)
  return plan!
}

function expectEntryUnderDay(
  data: AppData,
  planName: string,
  exerciseName: string,
  sets: number,
  reps: number,
  dayName: string,
): void {
  const plan = findPlan(data, planName)
  const day = plan.days.find((d) => d.name === dayName)
  expect(day, `nessun giorno "${dayName}"`).to.not.equal(undefined)
  const exerciseId = data.exercises.find((e) => e.name === exerciseName)?.id
  const entry = day!.entries.find((e) => e.exerciseId === exerciseId)
  expect(entry, `"${exerciseName}" non è sotto "${dayName}"`).to.not.equal(undefined)
  expect(entry!.sets).to.equal(sets)
  expect(entry!.reps).to.equal(reps)
}

Given('che ho creato la scheda {string}', function (this: GymWorld, name: string) {
  this.data = createPlan(this.data, name)
})

Given(
  "(che )aggiungo al giorno {string} della scheda {string} l'esercizio {string} con {int} serie da {int}",
  function (
    this: GymWorld,
    dayName: string,
    planName: string,
    exerciseName: string,
    sets: number,
    reps: number,
  ) {
    const plan = findPlan(this.data, planName)
    const ensured = ensureExercise(this.data, exerciseName)
    this.data = ensured.data
    if (!plan.days.some((d) => d.name === dayName)) {
      this.data = addDay(this.data, plan.id, dayName)
    }
    this.data = addEntry(this.data, plan.id, dayName, {
      exerciseId: ensured.exerciseId,
      sets,
      reps,
    })
  },
)

Given('(che )imposto {string} come scheda attiva', function (this: GymWorld, name: string) {
  this.data = setActivePlan(this.data, findPlan(this.data, name).id)
})

When('elimino la scheda {string}', function (this: GymWorld, name: string) {
  this.data = deletePlan(this.data, findPlan(this.data, name).id)
})

When("guardo l'allenamento di sabato {word}", function (this: GymWorld, date: string) {
  this.viewedDate = date
})

Then(
  'la scheda {string} prevede {string} {int}x{int} sotto {string}',
  function (
    this: GymWorld,
    planName: string,
    exerciseName: string,
    sets: number,
    reps: number,
    dayName: string,
  ) {
    expectEntryUnderDay(this.data, planName, exerciseName, sets, reps, dayName)
  },
)

Then(
  "l'allenamento di lunedì {word} propone l'esercizio {string}",
  function (this: GymWorld, date: string, exerciseName: string) {
    const plan = activePlan(this.data)
    expect(plan, 'nessuna scheda attiva').to.not.equal(null)
    const day = dayForDate(plan!, date)
    expect(day, `nessun allenamento previsto il ${date}`).to.not.equal(null)
    const names = day!.entries.map(
      (e) => this.data.exercises.find((x) => x.id === e.exerciseId)?.name,
    )
    expect(names).to.include(exerciseName)
  },
)

Then('le mie schede sono solo {string}', function (this: GymWorld, name: string) {
  expect(this.data.plans.map((p) => p.name)).to.deep.equal([name])
})

Then('la scheda attiva è ancora {string}', function (this: GymWorld, name: string) {
  expect(activePlan(this.data)?.name).to.equal(name)
})

Then('è un giorno di riposo', function (this: GymWorld) {
  const plan = activePlan(this.data)
  expect(dayForDate(plan!, this.viewedDate!)).to.equal(null)
})

Then(
  'il prossimo allenamento previsto è {string} in data {word}',
  function (this: GymWorld, dayName: string, date: string) {
    const next = nextScheduledDay(activePlan(this.data)!, this.viewedDate!)
    expect(next?.day.name).to.equal(dayName)
    expect(next?.date).to.equal(date)
  },
)

// --- Condivisione e importazione (issue #20, #21) ---

When(
  'genero il codice di condivisione della scheda {string}',
  function (this: GymWorld, name: string) {
    this.shareCode = encodePlanShare(this.data, findPlan(this.data, name).id)
  },
)

When('importo il codice su un dispositivo con dati vuoti', function (this: GymWorld) {
  this.otherData = emptyData()
  this.otherData = applySharedPayload(this.otherData, decodeShare(this.shareCode!)).data
})

When('importo il codice su quel dispositivo', function (this: GymWorld) {
  this.otherData = applySharedPayload(this.otherData, decodeShare(this.shareCode!)).data
})

When('provo a importare il codice {string}', function (this: GymWorld, code: string) {
  try {
    this.otherData = applySharedPayload(this.otherData, decodeShare(code)).data
    this.error = null
  } catch (error) {
    this.error = error instanceof Error ? error.message : String(error)
  }
})

Given(
  "che l'altro dispositivo ha già l'esercizio {string} con lo stesso video",
  function (this: GymWorld, name: string) {
    // Stesso video, forma diversa del link: il dedup è sul video, non sulla stringa
    this.otherData = addExercise(this.otherData, {
      name,
      description: 'Già presente qui',
      youtubeUrl: `https://www.youtube.com/watch?v=${videoIdFor(name)}`,
      muscleGroup: '',
      faceBlurConfirmed: true,
    })
  },
)

Then(
  "l'altro dispositivo ha la scheda {string} con i giorni {string} e {string}",
  function (this: GymWorld, planName: string, day1: string, day2: string) {
    const plan = findPlan(this.otherData, planName)
    expect(plan.days.map((d) => d.name)).to.deep.equal([day1, day2])
  },
)

Then(
  "l'altro dispositivo prevede {string} {int}x{int} sotto {string}",
  function (this: GymWorld, exerciseName: string, sets: number, reps: number, dayName: string) {
    const planName = this.otherData.plans[0]?.name ?? ''
    expectEntryUnderDay(this.otherData, planName, exerciseName, sets, reps, dayName)
  },
)

Then("l'importazione viene rifiutata", function (this: GymWorld) {
  expect(this.error).to.not.equal(null)
})

Then("i dati dell'altro dispositivo restano vuoti", function (this: GymWorld) {
  expect(this.otherData).to.deep.equal(emptyData())
})

Then("l'altro dispositivo ha un solo esercizio {string}", function (this: GymWorld, name: string) {
  expect(this.otherData.exercises.filter((e) => e.name === name)).to.have.lengthOf(1)
})
