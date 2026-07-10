import { expect } from 'chai'
import {
  addExercise,
  createExercise,
  EMPTY_NAME_ERROR,
  INVALID_YOUTUBE_LINK_ERROR,
  rankExercises,
  upvoteExercise,
} from '../../src/domain/exercises'
import { emptyData } from '../../src/services/storage'

const validInput = {
  name: 'Panca piana',
  description: 'Spinta su panca orizzontale',
  youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  muscleGroup: 'Petto',
}

describe('createExercise', () => {
  it('crea un esercizio con 0 voti', () => {
    const exercise = createExercise(validInput)
    expect(exercise.votes).to.equal(0)
    expect(exercise.name).to.equal('Panca piana')
    expect(exercise.id).to.be.a('string')
    expect(exercise.id).to.have.length.greaterThan(0)
  })

  it('rifiuta un link non YouTube', () => {
    expect(() => createExercise({ ...validInput, youtubeUrl: 'https://vimeo.com/1' })).to.throw(
      INVALID_YOUTUBE_LINK_ERROR,
    )
  })

  it('rifiuta un nome vuoto', () => {
    expect(() => createExercise({ ...validInput, name: '   ' })).to.throw(EMPTY_NAME_ERROR)
  })
})

describe('upvoteExercise', () => {
  it("incrementa solo i voti dell'esercizio indicato senza mutare lo stato", () => {
    const data = addExercise(addExercise(emptyData(), validInput), {
      ...validInput,
      name: 'Squat',
    })
    const [first, second] = data.exercises

    const updated = upvoteExercise(data, second.id)

    expect(updated.exercises.find((e) => e.id === second.id)?.votes).to.equal(1)
    expect(updated.exercises.find((e) => e.id === first.id)?.votes).to.equal(0)
    expect(data.exercises.find((e) => e.id === second.id)?.votes).to.equal(0)
  })
})

describe('rankExercises', () => {
  it('ordina per voti decrescenti', () => {
    let data = addExercise(addExercise(emptyData(), validInput), { ...validInput, name: 'Squat' })
    const squat = data.exercises.find((e) => e.name === 'Squat')!
    data = upvoteExercise(data, squat.id)

    const ranked = rankExercises(data.exercises)
    expect(ranked[0].name).to.equal('Squat')
    expect(ranked[1].name).to.equal('Panca piana')
  })
})
