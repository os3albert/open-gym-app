import { expect } from 'chai'
import LZString from 'lz-string'
import { addExercise } from '../../src/domain/exercises'
import { addDay, addEntry, createPlan } from '../../src/domain/plans'
import type { AppData } from '../../src/domain/types'
import {
  applySharedPayload,
  decodeShare,
  encodeExerciseShare,
  encodePlanShare,
  INVALID_SHARE_CODE_ERROR,
  shareCodeFromHash,
} from '../../src/services/share'
import { emptyData } from '../../src/services/storage'

function dataWithExercise(youtubeUrl = 'https://youtu.be/dQw4w9WgXcQ'): AppData {
  return addExercise(emptyData(), {
    name: 'Trazioni',
    description: 'Alla sbarra',
    youtubeUrl,
    muscleGroup: 'Dorso',
    stature: { minCm: 170, maxCm: 190 },
    faceBlurConfirmed: true,
  })
}

/** Scheda su due giorni: Lunedì con Trazioni 3×8, Giovedì con Squat 5×5. */
function dataWithSharablePlan(): AppData {
  let data = dataWithExercise()
  data = addExercise(data, {
    name: 'Squat',
    description: '',
    youtubeUrl: 'https://youtu.be/BBBBBBBBBBB',
    muscleGroup: 'Gambe',
    faceBlurConfirmed: true,
  })
  data = createPlan(data, 'Push Pull Legs')
  const planId = data.plans[0].id
  data = addDay(data, planId, 'Lunedì')
  data = addEntry(data, planId, 'Lunedì', { exerciseId: data.exercises[0].id, sets: 3, reps: 8 })
  data = addDay(data, planId, 'Giovedì')
  data = addEntry(data, planId, 'Giovedì', { exerciseId: data.exercises[1].id, sets: 5, reps: 5 })
  return data
}

describe('condivisione di un esercizio (issue #20)', () => {
  it('il codice fa il round-trip completo: titolo, fascia di statura e link YouTube', () => {
    const data = dataWithExercise()
    const payload = decodeShare(encodeExerciseShare(data.exercises[0]))

    expect(payload.kind).to.equal('exercise')
    if (payload.kind !== 'exercise') return
    expect(payload.exercise).to.deep.equal({
      name: 'Trazioni',
      description: 'Alla sbarra',
      youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
      muscleGroup: 'Dorso',
      stature: { minCm: 170, maxCm: 190 },
      faceBlurConfirmed: true,
    })
  })

  it('il codice è URL-safe (utilizzabile in un link #dati=…)', () => {
    const code = encodeExerciseShare(dataWithExercise().exercises[0])
    // L'alfabeto di lz-string per gli URI: tutti caratteri leciti in un fragment
    expect(code).to.match(/^[A-Za-z0-9+$-]+$/)
    expect(shareCodeFromHash(`#dati=${code}`)).to.equal(code)
    expect(shareCodeFromHash('#altro')).to.equal(null)
  })
})

describe('condivisione di una scheda (issue #20)', () => {
  it('il pacchetto incorpora gli esercizi: il destinatario riceve tutto', () => {
    const data = dataWithSharablePlan()
    const payload = decodeShare(encodePlanShare(data, data.plans[0].id))

    expect(payload.kind).to.equal('plan')
    if (payload.kind !== 'plan') return
    expect(payload.plan.name).to.equal('Push Pull Legs')
    expect(payload.plan.days.map((d) => d.name)).to.deep.equal(['Lunedì', 'Giovedì'])
    expect(payload.plan.days[0].entries[0].exercise.name).to.equal('Trazioni')
    expect(payload.plan.days[0].entries[0].sets).to.equal(3)
    expect(payload.plan.days[1].entries[0].exercise.name).to.equal('Squat')
  })
})

describe('importazione di un codice condiviso (issue #21)', () => {
  it('una scheda importata in un profilo pulito è identica: giorni, esercizi e target', () => {
    const source = dataWithSharablePlan()
    const code = encodePlanShare(source, source.plans[0].id)

    const result = applySharedPayload(emptyData(), decodeShare(code))

    expect(result.planId).to.equal(result.data.plans[0].id)
    const imported = result.data.plans[0]
    expect(imported.name).to.equal('Push Pull Legs')
    expect(imported.days.map((d) => d.name)).to.deep.equal(['Lunedì', 'Giovedì'])
    const names = imported.days.map((d) =>
      d.entries.map((e) => result.data.exercises.find((x) => x.id === e.exerciseId)?.name),
    )
    expect(names).to.deep.equal([['Trazioni'], ['Squat']])
    expect(imported.days[1].entries[0]).to.include({ sets: 5, reps: 5 })
    // Gli esercizi importati ripartono da 0 voti sul nuovo dispositivo
    expect(result.data.exercises.map((e) => e.votes)).to.deep.equal([0, 0])
  })

  it('non duplica un esercizio già presente: match sul video YouTube, non sulla forma del link', () => {
    const source = dataWithExercise('https://youtu.be/dQw4w9WgXcQ')
    const code = encodeExerciseShare(source.exercises[0])
    // Stesso video, forma diversa del link (watch?v=…): è lo stesso esercizio
    const local = dataWithExercise('https://www.youtube.com/watch?v=dQw4w9WgXcQ')

    const result = applySharedPayload(local, decodeShare(code))

    expect(result.data.exercises).to.have.lengthOf(1)
    expect(result.data.exercises[0].id).to.equal(local.exercises[0].id)
  })

  it('un codice corrotto o in formato sconosciuto viene rifiutato', () => {
    expect(() => decodeShare('non-un-codice!!!')).to.throw(INVALID_SHARE_CODE_ERROR)
    expect(() => decodeShare('')).to.throw(INVALID_SHARE_CODE_ERROR)
  })

  it('un JSON valido ma con struttura sconosciuta viene rifiutato', () => {
    // Codice tecnicamente decodificabile ma senza la forma attesa
    const bogus = LZString.compressToEncodedURIComponent(JSON.stringify({ version: 1, kind: 'x' }))
    expect(() => decodeShare(bogus)).to.throw(INVALID_SHARE_CODE_ERROR)
  })
})
