import { expect } from 'chai'
import {
  addExercise,
  createExercise,
  deleteExercise,
  EMPTY_NAME_ERROR,
  hasVoted,
  INVALID_STATURE_RANGE_ERROR,
  INVALID_YOUTUBE_LINK_ERROR,
  MISSING_DIFFICULTY_ERROR,
  MISSING_MUSCLE_GROUP_ERROR,
  rankExercises,
  toggleVote,
  updateExercise,
  type NewExercise,
} from '../../src/domain/exercises'
import { emptyData } from '../../src/services/storage'

const validInput: NewExercise = {
  name: 'Panca piana',
  description: 'Spinta su panca orizzontale',
  youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  muscleGroup: 'chest',
  difficulty: 'medium',
  faceBlurConfirmed: true,
}

describe('createExercise', () => {
  it('crea un esercizio con 0 voti', () => {
    const exercise = createExercise(validInput)
    expect(exercise.votes).to.equal(0)
    expect(exercise.name).to.equal('Panca piana')
    expect(exercise.faceBlurConfirmed).to.equal(true)
    expect(exercise.id).to.be.a('string')
    expect(exercise.id).to.have.length.greaterThan(0)
  })

  it('accetta una fascia di statura valida', () => {
    const exercise = createExercise({ ...validInput, stature: { minCm: 170, maxCm: 190 } })
    expect(exercise.stature).to.deep.equal({ minCm: 170, maxCm: 190 })
  })

  it('rifiuta un link non YouTube', () => {
    expect(() => createExercise({ ...validInput, youtubeUrl: 'https://vimeo.com/1' })).to.throw(
      INVALID_YOUTUBE_LINK_ERROR,
    )
  })

  it('accetta un esercizio del catalogo: GIF senza video (M16)', () => {
    const exercise = createExercise({
      ...validInput,
      youtubeUrl: '',
      gifUrl: 'https://raw.githubusercontent.com/x/y/main/videos/0001.gif',
    })
    expect(exercise.gifUrl).to.equal('https://raw.githubusercontent.com/x/y/main/videos/0001.gif')
    expect(exercise.youtubeUrl).to.equal('')
  })

  it('senza NESSUN media rifiuta; e un link scritto male resta un refuso anche con la GIF (M16)', () => {
    expect(() => createExercise({ ...validInput, youtubeUrl: '' })).to.throw(
      INVALID_YOUTUBE_LINK_ERROR,
    )
    expect(() =>
      createExercise({
        ...validInput,
        youtubeUrl: 'https://vimeo.com/1',
        gifUrl: 'https://raw.githubusercontent.com/x/y/main/videos/0001.gif',
      }),
    ).to.throw(INVALID_YOUTUBE_LINK_ERROR)
  })

  it('rifiuta la proposta senza grado di difficoltà (M13)', () => {
    const { difficulty: _senza, ...senzaDifficolta } = validInput
    expect(() => createExercise(senzaDifficolta as typeof validInput)).to.throw(
      MISSING_DIFFICULTY_ERROR,
    )
  })

  it('rifiuta un grado di difficoltà inventato', () => {
    expect(() => createExercise({ ...validInput, difficulty: 'impossibile' as never })).to.throw(
      MISSING_DIFFICULTY_ERROR,
    )
  })

  it('rifiuta la proposta senza gruppo muscolare (M14)', () => {
    expect(() => createExercise({ ...validInput, muscleGroup: '' as never })).to.throw(
      MISSING_MUSCLE_GROUP_ERROR,
    )
  })

  it('rifiuta un gruppo muscolare inventato', () => {
    expect(() => createExercise({ ...validInput, muscleGroup: 'pettorone' as never })).to.throw(
      MISSING_MUSCLE_GROUP_ERROR,
    )
  })

  it('rifiuta un nome vuoto', () => {
    expect(() => createExercise({ ...validInput, name: '   ' })).to.throw(EMPTY_NAME_ERROR)
  })

  it("il volto offuscato è un consiglio, non un obbligo: l'esercizio si crea comunque (M12)", () => {
    const exercise = createExercise({ ...validInput, faceBlurConfirmed: false })
    expect(exercise.name).to.equal(validInput.name)
    expect(exercise.faceBlurConfirmed).to.equal(false)
  })
})

describe('validazione della fascia di statura', () => {
  it('rifiuta min maggiore di max', () => {
    expect(() => createExercise({ ...validInput, stature: { minCm: 190, maxCm: 170 } })).to.throw(
      INVALID_STATURE_RANGE_ERROR,
    )
  })

  it('rifiuta valori fuori dai limiti plausibili', () => {
    expect(() => createExercise({ ...validInput, stature: { minCm: 20, maxCm: 190 } })).to.throw(
      INVALID_STATURE_RANGE_ERROR,
    )
    expect(() => createExercise({ ...validInput, stature: { minCm: 170, maxCm: 300 } })).to.throw(
      INVALID_STATURE_RANGE_ERROR,
    )
  })
})

describe('updateExercise', () => {
  it('aggiorna i campi mantenendo id, voti e data di creazione', () => {
    let data = addExercise(emptyData(), validInput)
    const original = data.exercises[0]
    data = toggleVote(data, original.id)

    data = updateExercise(data, original.id, { ...validInput, name: 'Panca inclinata' })

    const updated = data.exercises[0]
    expect(updated.name).to.equal('Panca inclinata')
    expect(updated.id).to.equal(original.id)
    expect(updated.votes).to.equal(1)
    expect(updated.createdAt).to.equal(original.createdAt)
  })

  it('rimuove la fascia di statura senza lasciare chiavi undefined', () => {
    let data = addExercise(emptyData(), { ...validInput, stature: { minCm: 170, maxCm: 190 } })
    data = updateExercise(data, data.exercises[0].id, validInput)
    expect('stature' in data.exercises[0]).to.equal(false)
  })

  it('rivalida i campi in modifica', () => {
    const data = addExercise(emptyData(), validInput)
    expect(() =>
      updateExercise(data, data.exercises[0].id, { ...validInput, youtubeUrl: 'https://x.com/1' }),
    ).to.throw(INVALID_YOUTUBE_LINK_ERROR)
  })
})

describe('deleteExercise', () => {
  it("elimina l'esercizio e il voto del dispositivo associato", () => {
    let data = addExercise(emptyData(), validInput)
    const id = data.exercises[0].id
    data = toggleVote(data, id)

    data = deleteExercise(data, id)

    expect(data.exercises).to.have.lengthOf(0)
    expect(data.votedExerciseIds).to.not.include(id)
  })
})

describe('toggleVote', () => {
  it('aggiunge il voto e lo segna come attivo per il dispositivo', () => {
    let data = addExercise(emptyData(), validInput)
    const id = data.exercises[0].id

    data = toggleVote(data, id)

    expect(data.exercises[0].votes).to.equal(1)
    expect(hasVoted(data, id)).to.equal(true)
  })

  it('un secondo voto rimuove il precedente (un voto per dispositivo)', () => {
    let data = addExercise(emptyData(), validInput)
    const id = data.exercises[0].id

    data = toggleVote(toggleVote(data, id), id)

    expect(data.exercises[0].votes).to.equal(0)
    expect(hasVoted(data, id)).to.equal(false)
  })

  it('ignora id inesistenti', () => {
    const data = addExercise(emptyData(), validInput)
    expect(toggleVote(data, 'non-esiste')).to.deep.equal(data)
  })

  it('non muta lo stato precedente', () => {
    const data = addExercise(emptyData(), validInput)
    toggleVote(data, data.exercises[0].id)
    expect(data.exercises[0].votes).to.equal(0)
    expect(data.votedExerciseIds).to.have.lengthOf(0)
  })
})

describe('rankExercises', () => {
  it('ordina per voti decrescenti', () => {
    let data = addExercise(addExercise(emptyData(), validInput), { ...validInput, name: 'Squat' })
    const squat = data.exercises.find((e) => e.name === 'Squat')!
    data = toggleVote(data, squat.id)

    const ranked = rankExercises(data.exercises)
    expect(ranked[0].name).to.equal('Squat')
    expect(ranked[1].name).to.equal('Panca piana')
  })
})
