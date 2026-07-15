import { expect } from 'chai'
import { importFromJson, INVALID_FORMAT_ERROR } from '../../src/services/importExport'

const v1Backup = {
  schemaVersion: 1,
  exercises: [
    {
      id: 'v1-1',
      name: 'Military press',
      description: 'Spinta verticale',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      muscleGroup: 'shoulders',
      votes: 3,
      createdAt: '2026-07-01T10:00:00.000Z',
    },
  ],
  plans: [],
  activity: [],
}

const v2Backup = {
  schemaVersion: 2,
  exercises: [],
  plans: [
    {
      id: 'p1',
      name: 'Full Body',
      days: [{ name: 'Lunedì', exerciseIds: ['e1', 'e2'] }],
      votes: 0,
    },
  ],
  activity: [],
  profile: { statureCm: null },
  votedExerciseIds: [],
}

describe('migrazione degli schemi precedenti', () => {
  it('migra un backup v1 alla versione corrente senza perdite', () => {
    const data = importFromJson(JSON.stringify(v1Backup))

    expect(data.schemaVersion).to.equal(5)
    expect(data.exercises).to.have.lengthOf(1)
    expect(data.exercises[0].name).to.equal('Military press')
    expect(data.exercises[0].votes).to.equal(3)
    // Campi introdotti dalla v2 con i default
    expect(data.exercises[0].faceBlurConfirmed).to.equal(false)
    expect(data.profile).to.deep.equal({ statureCm: null })
    expect(data.votedExerciseIds).to.deep.equal([])
    // Campi introdotti dalla v3 con i default
    expect(data.activePlanId).to.equal(null)
  })

  it('migra un backup v2: i giorni delle schede passano a entries con target 3×8', () => {
    const data = importFromJson(JSON.stringify(v2Backup))

    expect(data.schemaVersion).to.equal(5)
    expect(data.activePlanId).to.equal(null)
    expect(data.plans[0].days[0].name).to.equal('Lunedì')
    expect(data.plans[0].days[0].entries).to.deep.equal([
      { exerciseId: 'e1', sets: 3, reps: 8 },
      { exerciseId: 'e2', sets: 3, reps: 8 },
    ])
  })

  it('rifiuta versioni di schema sconosciute', () => {
    expect(() => importFromJson(JSON.stringify({ ...v1Backup, schemaVersion: 99 }))).to.throw(
      INVALID_FORMAT_ERROR,
    )
  })
})

describe('v3 → v4: il grado di difficoltà (M13)', () => {
  it('agli esercizi che non ce l’hanno assegna «media»: i backup vecchi non si rompono', () => {
    const v3 = {
      schemaVersion: 3,
      exercises: [
        {
          id: 'e1',
          name: 'Panca piana',
          description: '',
          youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
          muscleGroup: 'chest',
          faceBlurConfirmed: true,
          votes: 2,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      plans: [],
      activePlanId: null,
      activity: [],
      profile: { statureCm: null },
      votedExerciseIds: [],
    }

    const data = importFromJson(JSON.stringify(v3))

    expect(data.schemaVersion).to.equal(5)
    expect(data.exercises[0].difficulty).to.equal('medium')
    // Il resto dell'esercizio non viene toccato
    expect(data.exercises[0].votes).to.equal(2)
  })

  it('una difficoltà già presente non viene sovrascritta', () => {
    const v3 = {
      schemaVersion: 3,
      exercises: [
        {
          id: 'e1',
          name: 'Stacco',
          description: '',
          youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
          muscleGroup: 'back',
          difficulty: 'hard',
          faceBlurConfirmed: true,
          votes: 0,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      plans: [],
      activePlanId: null,
      activity: [],
      profile: { statureCm: null },
      votedExerciseIds: [],
    }

    expect(importFromJson(JSON.stringify(v3)).exercises[0].difficulty).to.equal('hard')
  })
})

describe('v4 → v5: il gruppo muscolare passa a codice (M14)', () => {
  it('normalizza il testo libero e non perde nulla per strada', () => {
    const v4 = {
      schemaVersion: 4,
      exercises: [
        {
          id: 'e1',
          name: 'Panca',
          description: '',
          youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
          muscleGroup: 'PETTO',
          difficulty: 'medium',
          faceBlurConfirmed: true,
          votes: 3,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'e2',
          name: 'Boh',
          description: '',
          youtubeUrl: 'https://youtu.be/BBBBBBBBBBB',
          muscleGroup: 'qualcosa di strano',
          difficulty: 'easy',
          faceBlurConfirmed: true,
          votes: 0,
          createdAt: '2026-01-02T00:00:00.000Z',
        },
      ],
      plans: [],
      activePlanId: null,
      activity: [],
      profile: { statureCm: null },
      votedExerciseIds: [],
    }

    const data = importFromJson(JSON.stringify(v4))

    expect(data.schemaVersion).to.equal(5)
    expect(data.exercises[0].muscleGroup).to.equal('chest')
    expect(data.exercises[0].votes).to.equal(3)
    // Un gruppo irriconoscibile non fa fallire l'import: finisce su «altro»
    expect(data.exercises[1].muscleGroup).to.equal('other')
  })
})
