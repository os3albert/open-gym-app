// Unit test in stile TDD con asserzioni Chai.
import { expect } from 'chai'
import type { ActivityRecord } from '../../src/domain/types'
import {
  suggestNextWeight,
  TARGET_REPS,
  WEIGHT_INCREMENT_KG,
} from '../../src/services/weightSuggestion'

function session(exerciseId: string, date: string, sets: Array<[number, number]>): ActivityRecord {
  return {
    id: `${exerciseId}-${date}`,
    exerciseId,
    date,
    sets: sets.map(([weightKg, reps]) => ({ weightKg, reps })),
  }
}

describe('suggestNextWeight', () => {
  it('ritorna null senza storico', () => {
    expect(suggestNextWeight([], 'panca')).to.equal(null)
  })

  it('ritorna null se lo storico riguarda solo altri esercizi', () => {
    const activity = [session('squat', '2026-07-01', [[100, 8]])]
    expect(suggestNextWeight(activity, 'panca')).to.equal(null)
  })

  it('propone un incremento quando tutte le serie raggiungono le ripetizioni obiettivo', () => {
    const activity = [
      session('panca', '2026-07-08', [
        [60, TARGET_REPS],
        [60, TARGET_REPS + 1],
      ]),
    ]
    expect(suggestNextWeight(activity, 'panca')).to.equal(60 + WEIGHT_INCREMENT_KG)
  })

  it('consolida lo stesso peso se una serie resta sotto le ripetizioni obiettivo', () => {
    const activity = [
      session('panca', '2026-07-08', [
        [60, TARGET_REPS],
        [60, TARGET_REPS - 2],
      ]),
    ]
    expect(suggestNextWeight(activity, 'panca')).to.equal(60)
  })

  it('considera solo la sessione più recente', () => {
    const activity = [
      session('stacco', '2026-07-01', [[100, TARGET_REPS]]),
      session('stacco', '2026-07-08', [[102.5, 5]]),
    ]
    expect(suggestNextWeight(activity, 'stacco')).to.equal(102.5)
  })

  it('usa il peso massimo tra le serie della sessione', () => {
    const activity = [
      session('panca', '2026-07-08', [
        [50, TARGET_REPS],
        [62.5, TARGET_REPS],
        [55, TARGET_REPS],
      ]),
    ]
    expect(suggestNextWeight(activity, 'panca')).to.equal(62.5 + WEIGHT_INCREMENT_KG)
  })

  it('ignora le sessioni senza serie registrate', () => {
    const activity = [session('panca', '2026-07-08', [])]
    expect(suggestNextWeight(activity, 'panca')).to.equal(null)
  })
})
