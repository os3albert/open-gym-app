import { Given, Then, When } from '@cucumber/cucumber'
import { expect } from 'chai'
import { recordSet } from '../../src/domain/activity'
import { addExercise } from '../../src/domain/exercises'
import { emptyData, loadData, saveData } from '../../src/services/storage'
import type { GymWorld } from '../support/world'

const OGGI = '2026-07-11'

function ensureExercise(world: GymWorld, name: string): string {
  let exercise = world.data.exercises.find((e) => e.name === name)
  if (!exercise) {
    world.data = addExercise(world.data, {
      name,
      description: '',
      youtubeUrl: 'https://youtu.be/AAAAAAAAAAA',
      muscleGroup: 'chest',
      difficulty: 'medium',
      faceBlurConfirmed: true,
    })
    exercise = world.data.exercises[world.data.exercises.length - 1]
  }
  return exercise.id
}

function todayRecord(world: GymWorld, name: string) {
  const id = world.data.exercises.find((e) => e.name === name)?.id
  return world.data.activity.find((a) => a.exerciseId === id && a.date === OGGI)
}

Given('che sto registrando la sessione di oggi', function (this: GymWorld) {
  this.data = emptyData()
})

Given(
  "che ho aggiunto l'esercizio {string} con {int} serie da {int} ripetizioni a {float} kg",
  function (this: GymWorld, name: string, series: number, reps: number, weightKg: number) {
    const id = ensureExercise(this, name)
    for (let i = 0; i < series; i++) {
      this.data = recordSet(this.data, id, OGGI, { weightKg, reps })
    }
  },
)

When(
  "aggiungo l'esercizio {string} con {int} serie da {int} ripetizioni a {float} kg",
  function (this: GymWorld, name: string, series: number, reps: number, weightKg: number) {
    const id = ensureExercise(this, name)
    for (let i = 0; i < series; i++) {
      this.data = recordSet(this.data, id, OGGI, { weightKg, reps })
    }
  },
)

When(
  "registro per l'esercizio {string} le serie con pesi {float}, {float} e {float} kg",
  function (this: GymWorld, name: string, w1: number, w2: number, w3: number) {
    const id = ensureExercise(this, name)
    for (const weightKg of [w1, w2, w3]) {
      this.data = recordSet(this.data, id, OGGI, { weightKg, reps: 8 })
    }
  },
)

When(
  'provo a registrare per {string} una serie da {int} ripetizioni a {float} kg',
  function (this: GymWorld, name: string, reps: number, weightKg: number) {
    const id = ensureExercise(this, name)
    try {
      this.data = recordSet(this.data, id, OGGI, { weightKg, reps })
      this.error = null
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error)
    }
  },
)

When("salvo e ricarico i dati dell'app", function (this: GymWorld) {
  const store = new Map<string, string>()
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
  }
  saveData(this.data, storage)
  this.data = loadData(storage)
})

Then(
  'la sessione di oggi contiene {string} con {int} serie',
  function (this: GymWorld, name: string, series: number) {
    const record = todayRecord(this, name)
    expect(record, `nessuna sessione di oggi per "${name}"`).to.not.equal(undefined)
    expect(record!.sets).to.have.lengthOf(series)
  },
)

Then(
  'tutte le serie di {string} hanno {float} kg e {int} ripetizioni',
  function (this: GymWorld, name: string, weightKg: number, reps: number) {
    const record = todayRecord(this, name)
    expect(record!.sets.every((s) => s.weightKg === weightKg && s.reps === reps)).to.equal(true)
  },
)

Then(
  'le serie di {string} nella sessione di oggi hanno i pesi {float}, {float} e {float} kg',
  function (this: GymWorld, name: string, w1: number, w2: number, w3: number) {
    const record = todayRecord(this, name)
    expect(record!.sets.map((s) => s.weightKg)).to.deep.equal([w1, w2, w3])
  },
)

Then('la registrazione viene rifiutata', function (this: GymWorld) {
  expect(this.error).to.not.equal(null)
})
