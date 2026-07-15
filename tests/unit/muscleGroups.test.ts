// Chiudere su una lista un campo che per tre milestone è stato testo libero.
import { expect } from 'chai'
import { normalizeMuscleGroup } from '../../src/domain/muscleGroups'

describe('normalizzazione del gruppo muscolare (M14)', () => {
  it('maiuscole e minuscole non contano: erano tre gruppi diversi, ora sono uno', () => {
    expect(normalizeMuscleGroup('Petto')).to.equal('chest')
    expect(normalizeMuscleGroup('petto')).to.equal('chest')
    expect(normalizeMuscleGroup('PETTO')).to.equal('chest')
    expect(normalizeMuscleGroup('  Petto  ')).to.equal('chest')
  })

  it('riconosce i sinonimi italiani e inglesi', () => {
    expect(normalizeMuscleGroup('Dorso')).to.equal('back')
    expect(normalizeMuscleGroup('Schiena')).to.equal('back')
    expect(normalizeMuscleGroup('back')).to.equal('back')
    expect(normalizeMuscleGroup('Addominali')).to.equal('core')
    expect(normalizeMuscleGroup('Full body')).to.equal('fullBody')
  })

  it('gli accenti non contano', () => {
    expect(normalizeMuscleGroup('Pèttorali')).to.equal('chest')
  })

  it('un codice già valido resta com’è', () => {
    expect(normalizeMuscleGroup('shoulders')).to.equal('shoulders')
  })

  it('ciò che non si riconosce finisce su «altro», non si perde e non fa fallire l’import', () => {
    expect(normalizeMuscleGroup('boh')).to.equal('other')
    expect(normalizeMuscleGroup('')).to.equal('other')
    expect(normalizeMuscleGroup(undefined)).to.equal('other')
    expect(normalizeMuscleGroup(42)).to.equal('other')
  })
})
