import { Given, Then, When } from '@cucumber/cucumber'
import { expect } from 'chai'
import {
  addExercise,
  hasVoted,
  rankExercises,
  toggleVote,
  type NewExercise,
} from '../../src/domain/exercises'
import type { StatureRange } from '../../src/domain/types'
import { makeTranslate, translateError } from '../../src/i18n'
import { emptyData } from '../../src/services/storage'
import type { GymWorld } from '../support/world'

const VALID_LINK = 'https://youtu.be/AAAAAAAAAAA'

function newExercise(name: string, youtubeUrl: string, stature?: StatureRange): NewExercise {
  return {
    name,
    youtubeUrl,
    description: '',
    muscleGroup: '',
    difficulty: 'medium',
    faceBlurConfirmed: true,
    ...(stature ? { stature } : {}),
  }
}

function findExercise(world: GymWorld, name: string) {
  const exercise = world.data.exercises.find((e) => e.name === name)
  expect(exercise, `esercizio "${name}" non trovato`).to.not.equal(undefined)
  return exercise!
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

Given(
  "che è stato proposto l'esercizio {string} con fascia di statura da {int} a {int} cm",
  function (this: GymWorld, name: string, minCm: number, maxCm: number) {
    this.data = addExercise(this.data, newExercise(name, VALID_LINK, { minCm, maxCm }))
  },
)

Given(
  "che è stato proposto l'esercizio {string} senza fascia di statura",
  function (this: GymWorld, name: string) {
    this.data = addExercise(this.data, newExercise(name, VALID_LINK))
  },
)

Given(
  "che l'esercizio {string} ha già {int} voti",
  function (this: GymWorld, name: string, votes: number) {
    const exercise = findExercise(this, name)
    this.data = {
      ...this.data,
      exercises: this.data.exercises.map((e) => (e.id === exercise.id ? { ...e, votes } : e)),
    }
  },
)

Given("che ho già votato l'esercizio {string}", function (this: GymWorld, name: string) {
  this.data = toggleVote(this.data, findExercise(this, name).id)
})

When(
  "propongo l'esercizio {string} con link {string}",
  function (this: GymWorld, name: string, youtubeUrl: string) {
    this.data = addExercise(this.data, newExercise(name, youtubeUrl))
  },
)

When(
  "propongo l'esercizio {string} con fascia di statura da {int} a {int} cm",
  function (this: GymWorld, name: string, minCm: number, maxCm: number) {
    this.data = addExercise(this.data, newExercise(name, VALID_LINK, { minCm, maxCm }))
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

When(
  "propongo l'esercizio {string} senza confermare il volto offuscato",
  function (this: GymWorld, name: string) {
    try {
      this.data = addExercise(this.data, {
        ...newExercise(name, VALID_LINK),
        difficulty: 'medium',
        faceBlurConfirmed: false,
      })
      this.error = null
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error)
    }
  },
)

When("faccio upvote all'esercizio {string}", function (this: GymWorld, name: string) {
  this.data = toggleVote(this.data, findExercise(this, name).id)
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
    expect(findExercise(this, name).votes).to.equal(Number(votes))
  },
)

Then(
  "l'esercizio {string} ha la fascia di statura da {int} a {int} cm",
  function (this: GymWorld, name: string, minCm: number, maxCm: number) {
    expect(findExercise(this, name).stature).to.deep.equal({ minCm, maxCm })
  },
)

Then('il mio voto per {string} risulta attivo', function (this: GymWorld, name: string) {
  expect(hasVoted(this.data, findExercise(this, name).id)).to.equal(true)
})

Then('il mio voto per {string} non risulta attivo', function (this: GymWorld, name: string) {
  expect(hasVoted(this.data, findExercise(this, name).id)).to.equal(false)
})

Then(
  "la proposta viene rifiutata con l'errore {string}",
  function (this: GymWorld, message: string) {
    // Il dominio lancia un CODICE (INVALID_YOUTUBE_LINK), lo scenario parla la lingua dell'utente:
    // è lo step a tradurre, non la specifica a doversi imparare i codici.
    expect(translateError(makeTranslate('it'), this.error)).to.equal(message)
  },
)

Then("l'elenco degli esercizi è vuoto", function (this: GymWorld) {
  expect(this.data.exercises).to.have.lengthOf(0)
})

Then('il primo esercizio in classifica è {string}', function (this: GymWorld, name: string) {
  const ranked = rankExercises(this.data.exercises)
  expect(ranked[0]?.name).to.equal(name)
})
