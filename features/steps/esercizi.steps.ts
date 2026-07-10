import { Given, Then, When } from '@cucumber/cucumber'
import { expect } from 'chai'
import { addExercise, rankExercises, upvoteExercise } from '../../src/domain/exercises'
import { emptyData } from '../../src/services/storage'
import type { GymWorld } from '../support/world'

function newExercise(name: string, youtubeUrl: string) {
  return { name, youtubeUrl, description: '', muscleGroup: '' }
}

Given('che non ci sono esercizi salvati', function (this: GymWorld) {
  this.data = emptyData()
})

Given(
  "che è stato proposto l'esercizio {string} con link {string}",
  function (this: GymWorld, name: string, youtubeUrl: string) {
    this.data = addExercise(this.data, newExercise(name, youtubeUrl))
  },
)

When(
  "propongo l'esercizio {string} con link {string}",
  function (this: GymWorld, name: string, youtubeUrl: string) {
    this.data = addExercise(this.data, newExercise(name, youtubeUrl))
  },
)

When(
  "provo a proporre l'esercizio {string} con link {string}",
  function (this: GymWorld, name: string, youtubeUrl: string) {
    try {
      this.data = addExercise(this.data, newExercise(name, youtubeUrl))
      this.error = null
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error)
    }
  },
)

When("faccio upvote all'esercizio {string}", function (this: GymWorld, name: string) {
  const exercise = this.data.exercises.find((e) => e.name === name)
  expect(exercise, `esercizio "${name}" non trovato`).to.not.equal(undefined)
  this.data = upvoteExercise(this.data, exercise!.id)
})

Then(
  "l'esercizio {string} compare nell'elenco degli esercizi",
  function (this: GymWorld, name: string) {
    expect(this.data.exercises.map((e) => e.name)).to.include(name)
  },
)

Then(
  /^l'esercizio "([^"]*)" ha (\d+) vot[oi]$/,
  function (this: GymWorld, name: string, votes: string) {
    const exercise = this.data.exercises.find((e) => e.name === name)
    expect(exercise, `esercizio "${name}" non trovato`).to.not.equal(undefined)
    expect(exercise!.votes).to.equal(Number(votes))
  },
)

Then(
  "la proposta viene rifiutata con l'errore {string}",
  function (this: GymWorld, message: string) {
    expect(this.error).to.equal(message)
  },
)

Then("l'elenco degli esercizi è vuoto", function (this: GymWorld) {
  expect(this.data.exercises).to.have.lengthOf(0)
})

Then('il primo esercizio in classifica è {string}', function (this: GymWorld, name: string) {
  const ranked = rankExercises(this.data.exercises)
  expect(ranked[0]?.name).to.equal(name)
})
