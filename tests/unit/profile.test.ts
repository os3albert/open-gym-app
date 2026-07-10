import { expect } from 'chai'
import { INVALID_STATURE_ERROR, setStature } from '../../src/domain/profile'
import { emptyData } from '../../src/services/storage'

describe('setStature', () => {
  it('imposta la statura arrotondata al cm', () => {
    expect(setStature(emptyData(), 180.4).profile.statureCm).to.equal(180)
  })

  it('rifiuta valori non plausibili', () => {
    expect(() => setStature(emptyData(), 80)).to.throw(INVALID_STATURE_ERROR)
    expect(() => setStature(emptyData(), 260)).to.throw(INVALID_STATURE_ERROR)
    expect(() => setStature(emptyData(), NaN)).to.throw(INVALID_STATURE_ERROR)
  })
})
