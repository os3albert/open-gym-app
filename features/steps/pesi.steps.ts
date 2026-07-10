import { Given, Then, When, type DataTable } from '@cucumber/cucumber'
import { expect } from 'chai'
import { suggestNextWeight } from '../../src/services/weightSuggestion'
import { generateId } from '../../src/utils/id'
import type { GymWorld } from '../support/world'

// Negli step il nome dell'esercizio fa da exerciseId: qui si esercita solo il dominio del tracking.

Given(
  "che non ho attività registrate per l'esercizio {string}",
  function (this: GymWorld, exerciseName: string) {
    this.data.activity = this.data.activity.filter((a) => a.exerciseId !== exerciseName)
  },
)

Given(
  "che ho registrato per l'esercizio {string} una sessione in data {string} con le serie:",
  function (this: GymWorld, exerciseName: string, date: string, table: DataTable) {
    const sets = table.hashes().map((row) => ({
      weightKg: Number(row.peso),
      reps: Number(row.ripetizioni),
    }))
    this.data.activity.push({ id: generateId(), exerciseId: exerciseName, date, sets })
  },
)

When(
  "chiedo il peso suggerito per l'esercizio {string}",
  function (this: GymWorld, exerciseName: string) {
    this.suggestion = suggestNextWeight(this.data.activity, exerciseName)
  },
)

Then('non ricevo alcun suggerimento di peso', function (this: GymWorld) {
  expect(this.suggestion).to.equal(null)
})

Then('il peso suggerito è di {float} kg', function (this: GymWorld, weight: number) {
  expect(this.suggestion).to.equal(weight)
})
