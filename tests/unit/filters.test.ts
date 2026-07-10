import { expect } from 'chai'
import { addExercise, toggleVote, type NewExercise } from '../../src/domain/exercises'
import {
  applyFilters,
  defaultFilters,
  isSuitableForStature,
  muscleGroups,
  suitabilityRequiresStature,
} from '../../src/domain/filters'
import { setStature } from '../../src/domain/profile'
import type { AppData } from '../../src/domain/types'
import { emptyData } from '../../src/services/storage'

function input(name: string, extra: Partial<NewExercise> = {}): NewExercise {
  return {
    name,
    description: '',
    youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
    muscleGroup: 'Petto',
    faceBlurConfirmed: true,
    ...extra,
  }
}

function names(data: AppData, filters = defaultFilters) {
  return applyFilters(data, filters).map((e) => e.name)
}

describe('isSuitableForStature', () => {
  const exercise = addExercise(emptyData(), input('X', { stature: { minCm: 170, maxCm: 190 } }))
    .exercises[0]

  it('include gli estremi della fascia', () => {
    expect(isSuitableForStature(exercise, 170)).to.equal(true)
    expect(isSuitableForStature(exercise, 190)).to.equal(true)
  })

  it('esclude fuori fascia', () => {
    expect(isSuitableForStature(exercise, 169)).to.equal(false)
    expect(isSuitableForStature(exercise, 191)).to.equal(false)
  })

  it('senza fascia è adatto a chiunque', () => {
    const anyone = addExercise(emptyData(), input('Libero')).exercises[0]
    expect(isSuitableForStature(anyone, 120)).to.equal(true)
  })
})

describe('applyFilters', () => {
  function sampleData(): AppData {
    let data = emptyData()
    data = addExercise(data, input('Adatto', { stature: { minCm: 170, maxCm: 190 } }))
    data = addExercise(data, input('Basso', { stature: { minCm: 150, maxCm: 165 } }))
    data = addExercise(data, input('PerTutti', { muscleGroup: 'Dorso' }))
    return setStature(data, 185)
  }

  it('"Adatti a me" filtra sulla statura del profilo', () => {
    const visible = names(sampleData(), { ...defaultFilters, suitableOnly: true })
    expect(visible).to.have.members(['Adatto', 'PerTutti'])
  })

  it('senza statura nel profilo il filtro statura non è applicato', () => {
    let data = emptyData()
    data = addExercise(data, input('Basso', { stature: { minCm: 150, maxCm: 165 } }))
    const visible = names(data, { ...defaultFilters, suitableOnly: true })
    expect(visible).to.deep.equal(['Basso'])
  })

  it('filtra per gruppo muscolare', () => {
    const visible = names(sampleData(), { ...defaultFilters, muscleGroup: 'Dorso' })
    expect(visible).to.deep.equal(['PerTutti'])
  })

  it('ordina per voti decrescenti', () => {
    let data = sampleData()
    const basso = data.exercises.find((e) => e.name === 'Basso')!
    data = toggleVote(data, basso.id)
    expect(names(data, { ...defaultFilters, sort: 'votes' })[0]).to.equal('Basso')
  })

  it('ordina per data decrescente', () => {
    let data = emptyData()
    data = addExercise(data, input('Vecchio'))
    data.exercises[0].createdAt = '2026-01-01T00:00:00.000Z'
    data = addExercise(data, input('Nuovo'))
    data.exercises[1].createdAt = '2026-07-01T00:00:00.000Z'
    expect(names(data, { ...defaultFilters, sort: 'recent' })).to.deep.equal(['Nuovo', 'Vecchio'])
  })

  it('combina statura, gruppo muscolare e ordinamento', () => {
    const visible = names(sampleData(), {
      suitableOnly: true,
      muscleGroup: 'Petto',
      sort: 'votes',
    })
    expect(visible).to.deep.equal(['Adatto'])
  })
})

describe('suitabilityRequiresStature', () => {
  it('è vero solo con filtro attivo e statura mancante', () => {
    const noStature = emptyData()
    expect(
      suitabilityRequiresStature({ ...defaultFilters, suitableOnly: true }, noStature),
    ).to.equal(true)
    expect(suitabilityRequiresStature(defaultFilters, noStature)).to.equal(false)
    expect(
      suitabilityRequiresStature(
        { ...defaultFilters, suitableOnly: true },
        setStature(noStature, 180),
      ),
    ).to.equal(false)
  })
})

describe('muscleGroups', () => {
  it('elenca i gruppi unici ordinati', () => {
    let data = emptyData()
    data = addExercise(data, input('A', { muscleGroup: 'Petto' }))
    data = addExercise(data, input('B', { muscleGroup: 'Dorso' }))
    data = addExercise(data, input('C', { muscleGroup: 'Petto' }))
    expect(muscleGroups(data.exercises)).to.deep.equal(['Dorso', 'Petto'])
  })
})
