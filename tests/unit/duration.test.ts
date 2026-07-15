// Unit del formato durata usato dal timer di allenamento (M14).
import { expect } from 'chai'
import { formatDuration } from '../../src/utils/duration'

describe('formatDuration', () => {
  it('formatta minuti e secondi', () => {
    expect(formatDuration(0)).to.equal('0:00')
    expect(formatDuration(5_000)).to.equal('0:05')
    expect(formatDuration(65_000)).to.equal('1:05')
    expect(formatDuration(600_000)).to.equal('10:00')
  })

  it("oltre l'ora aggiunge le ore e riparte coi minuti", () => {
    expect(formatDuration(3_600_000)).to.equal('1:00:00')
    expect(formatDuration(3_725_000)).to.equal('1:02:05')
  })

  it('tronca i millisecondi parziali e non va mai sotto zero', () => {
    expect(formatDuration(1_999)).to.equal('0:01')
    expect(formatDuration(-5_000)).to.equal('0:00')
  })
})
