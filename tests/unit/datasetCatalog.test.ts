// Unit della mappatura dal vocabolario del dataset Gym visual ai nostri gruppi (M16).
import { expect } from 'chai'
import { mapDatasetMuscleGroup, trimInstructions } from '../../src/services/datasetCatalog'

describe('mapDatasetMuscleGroup', () => {
  it('il muscolo bersaglio vince sulla parte del corpo', () => {
    // «glutes» sta in «upper legs», ma non è «legs»
    expect(mapDatasetMuscleGroup('glutes', 'upper legs')).to.equal('glutes')
    expect(mapDatasetMuscleGroup('abs', 'waist')).to.equal('core')
    expect(mapDatasetMuscleGroup('pectorals', 'chest')).to.equal('chest')
    expect(mapDatasetMuscleGroup('biceps', 'upper arms')).to.equal('arms')
    expect(mapDatasetMuscleGroup('delts', 'shoulders')).to.equal('shoulders')
    expect(mapDatasetMuscleGroup('lats', 'back')).to.equal('back')
    expect(mapDatasetMuscleGroup('calves', 'lower legs')).to.equal('calves')
    expect(mapDatasetMuscleGroup('cardiovascular system', 'cardio')).to.equal('fullBody')
  })

  it('un bersaglio ignoto ricade sulla parte del corpo', () => {
    expect(mapDatasetMuscleGroup('muscolo nuovo', 'upper legs')).to.equal('legs')
    expect(mapDatasetMuscleGroup('muscolo nuovo', 'lower arms')).to.equal('arms')
  })

  it('l’ignoto totale finisce su «other»: il catalogo non rifiuta mai un record', () => {
    expect(mapDatasetMuscleGroup('boh', 'parte nuova')).to.equal('other')
    expect(mapDatasetMuscleGroup('levator scapulae', 'neck')).to.equal('other')
  })
})

describe('trimInstructions', () => {
  it('un testo corto passa intero, ripulito degli spazi doppi', () => {
    expect(trimInstructions('  Sdraiati  sulla panca.  ')).to.equal('Sdraiati sulla panca.')
  })

  it('un testo lungo si tronca a fine parola con l’ellissi, entro il limite', () => {
    const lungo = 'parola '.repeat(100)
    const trimmed = trimInstructions(lungo, 50)
    expect(trimmed.length).to.be.at.most(51) // 50 + l'ellissi
    expect(trimmed.endsWith('…')).to.equal(true)
    expect(trimmed).to.not.match(/\bparo…/) // mai a metà parola
  })
})
