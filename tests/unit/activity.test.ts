import { expect } from 'chai'
import {
  EXERCISE_NOT_FOUND_ERROR,
  exerciseHistory,
  filterByPeriod,
  INVALID_SET_ERROR,
  lastSession,
  recordSet,
  removeSet,
  sessionsByDate,
} from '../../src/domain/activity'
import { addExercise } from '../../src/domain/exercises'
import type { AppData } from '../../src/domain/types'
import { emptyData } from '../../src/services/storage'

function withExercise(name = 'Panca piana'): { data: AppData; id: string } {
  const data = addExercise(emptyData(), {
    name,
    description: '',
    youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
    muscleGroup: 'Petto',
    faceBlurConfirmed: true,
  })
  return { data, id: data.exercises[data.exercises.length - 1].id }
}

describe('recordSet', () => {
  it('crea il record della sessione alla prima serie', () => {
    const { data, id } = withExercise()
    const updated = recordSet(data, id, '2026-07-11', { weightKg: 60, reps: 8 })

    expect(updated.activity).to.have.lengthOf(1)
    expect(updated.activity[0]).to.include({ exerciseId: id, date: '2026-07-11' })
    expect(updated.activity[0].sets).to.deep.equal([{ weightKg: 60, reps: 8 }])
  })

  it('appende le serie successive allo stesso giorno, ognuna con il proprio peso', () => {
    const { data, id } = withExercise()
    let updated = recordSet(data, id, '2026-07-11', { weightKg: 60, reps: 8 })
    updated = recordSet(updated, id, '2026-07-11', { weightKg: 65, reps: 6 })
    updated = recordSet(updated, id, '2026-07-11', { weightKg: 70, reps: 4 })

    expect(updated.activity).to.have.lengthOf(1)
    expect(updated.activity[0].sets.map((s) => s.weightKg)).to.deep.equal([60, 65, 70])
  })

  it('giorni diversi producono record diversi', () => {
    const { data, id } = withExercise()
    let updated = recordSet(data, id, '2026-07-10', { weightKg: 60, reps: 8 })
    updated = recordSet(updated, id, '2026-07-11', { weightKg: 62.5, reps: 8 })
    expect(updated.activity).to.have.lengthOf(2)
  })

  it('rifiuta serie non valide', () => {
    const { data, id } = withExercise()
    expect(() => recordSet(data, id, '2026-07-11', { weightKg: 60, reps: 0 })).to.throw(
      INVALID_SET_ERROR,
    )
    expect(() => recordSet(data, id, '2026-07-11', { weightKg: -5, reps: 8 })).to.throw(
      INVALID_SET_ERROR,
    )
    expect(() => recordSet(data, id, '2026-07-11', { weightKg: NaN, reps: 8 })).to.throw(
      INVALID_SET_ERROR,
    )
  })

  it('rifiuta un esercizio inesistente', () => {
    expect(() =>
      recordSet(emptyData(), 'fantasma', '2026-07-11', { weightKg: 60, reps: 8 }),
    ).to.throw(EXERCISE_NOT_FOUND_ERROR)
  })
})

describe('removeSet', () => {
  it('rimuove una singola serie', () => {
    const { data, id } = withExercise()
    let updated = recordSet(data, id, '2026-07-11', { weightKg: 60, reps: 8 })
    updated = recordSet(updated, id, '2026-07-11', { weightKg: 65, reps: 6 })

    updated = removeSet(updated, updated.activity[0].id, 0)

    expect(updated.activity[0].sets).to.deep.equal([{ weightKg: 65, reps: 6 }])
  })

  it('elimina il record rimasto senza serie', () => {
    const { data, id } = withExercise()
    let updated = recordSet(data, id, '2026-07-11', { weightKg: 60, reps: 8 })
    updated = removeSet(updated, updated.activity[0].id, 0)
    expect(updated.activity).to.have.lengthOf(0)
  })
})

describe('sessionsByDate', () => {
  it('raggruppa per giorno dalla più recente', () => {
    const { data, id } = withExercise()
    let updated = recordSet(data, id, '2026-07-01', { weightKg: 60, reps: 8 })
    updated = recordSet(updated, id, '2026-07-11', { weightKg: 65, reps: 8 })
    updated = recordSet(updated, id, '2026-07-05', { weightKg: 62.5, reps: 8 })

    expect(sessionsByDate(updated.activity).map((s) => s.date)).to.deep.equal([
      '2026-07-11',
      '2026-07-05',
      '2026-07-01',
    ])
  })
})

describe('lastSession', () => {
  it("ritorna la sessione più recente per l'esercizio", () => {
    const { data, id } = withExercise()
    let updated = recordSet(data, id, '2026-07-01', { weightKg: 60, reps: 8 })
    updated = recordSet(updated, id, '2026-07-11', { weightKg: 65, reps: 5 })

    expect(lastSession(updated.activity, id)?.date).to.equal('2026-07-11')
    expect(lastSession(updated.activity, 'altro')).to.equal(null)
  })
})

describe('exerciseHistory', () => {
  it('produce il peso massimo per giorno in ordine cronologico', () => {
    const { data, id } = withExercise()
    let updated = recordSet(data, id, '2026-07-11', { weightKg: 60, reps: 8 })
    updated = recordSet(updated, id, '2026-07-11', { weightKg: 70, reps: 4 })
    updated = recordSet(updated, id, '2026-07-01', { weightKg: 55, reps: 8 })

    expect(exerciseHistory(updated.activity, id)).to.deep.equal([
      { date: '2026-07-01', maxWeightKg: 55 },
      { date: '2026-07-11', maxWeightKg: 70 },
    ])
  })

  it('ignora gli altri esercizi', () => {
    const first = withExercise('Panca piana')
    const dataWithBoth = addExercise(first.data, {
      name: 'Squat',
      description: '',
      youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
      muscleGroup: 'Gambe',
      faceBlurConfirmed: true,
    })
    const squatId = dataWithBoth.exercises[1].id
    const updated = recordSet(dataWithBoth, squatId, '2026-07-11', { weightKg: 100, reps: 5 })

    expect(exerciseHistory(updated.activity, first.id)).to.deep.equal([])
  })
})

describe('filterByPeriod', () => {
  const points = [
    { date: '2026-01-01', maxWeightKg: 50 },
    { date: '2026-06-20', maxWeightKg: 60 },
    { date: '2026-07-10', maxWeightKg: 65 },
  ]

  it('limita agli ultimi N giorni', () => {
    expect(filterByPeriod(points, 30, '2026-07-11').map((p) => p.date)).to.deep.equal([
      '2026-06-20',
      '2026-07-10',
    ])
  })

  it('null = tutto lo storico', () => {
    expect(filterByPeriod(points, null, '2026-07-11')).to.deep.equal(points)
  })
})
