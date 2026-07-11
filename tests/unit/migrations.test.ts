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
      muscleGroup: 'Spalle',
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

    expect(data.schemaVersion).to.equal(3)
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

    expect(data.schemaVersion).to.equal(3)
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
