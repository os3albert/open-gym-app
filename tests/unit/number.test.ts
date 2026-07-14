// Le scale della rotella: sono numeri, e in virgola mobile i numeri mentono.
import { expect } from 'chai'
import { range } from '../../src/utils/number'

describe('range', () => {
  it('elenca i valori interi da min a max, estremi compresi', () => {
    expect(range(1, 5)).to.deep.equal([1, 2, 3, 4, 5])
  })

  it('conta a passi frazionari senza sbavature: 0.1 + 0.2 non fa 0.3', () => {
    // È il motivo per cui si conta in passi interi e si arrotonda
    expect(range(0, 10, 2.5)).to.deep.equal([0, 2.5, 5, 7.5, 10])
    expect(range(0, 0.3, 0.1)).to.deep.equal([0, 0.1, 0.2, 0.3])
  })

  it('i carichi di un bilanciere: da 0 a 300 kg a passi di 2,5', () => {
    const weights = range(0, 300, 2.5)
    expect(weights).to.have.lengthOf(121)
    expect(weights[weights.length - 1]).to.equal(300)
  })
})
