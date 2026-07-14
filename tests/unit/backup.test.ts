import { expect } from 'chai'
import { recordSet } from '../../src/domain/activity'
import { addExercise, toggleVote } from '../../src/domain/exercises'
import { addDay, addEntry, createPlan, setActivePlan } from '../../src/domain/plans'
import { setStature } from '../../src/domain/profile'
import type { AppData } from '../../src/domain/types'
import {
  backupFileName,
  exportBackupJson,
  importFromJson,
  mergeData,
} from '../../src/services/importExport'
import { emptyData } from '../../src/services/storage'

function withExercise(name: string, youtubeUrl: string, base: AppData = emptyData()): AppData {
  return addExercise(base, {
    name,
    description: '',
    youtubeUrl,
    muscleGroup: 'Dorso',
    difficulty: 'medium',
    faceBlurConfirmed: true,
  })
}

describe('export del backup (issue #23)', () => {
  it('il file contiene tutti i dati, la versione dello schema e la data di export', () => {
    const data = withExercise('Trazioni', 'https://youtu.be/dQw4w9WgXcQ')
    const parsed = JSON.parse(exportBackupJson(data, new Date('2026-07-11T10:30:00Z')))

    expect(parsed.schemaVersion).to.equal(4)
    expect(parsed.exportedAt).to.equal('2026-07-11T10:30:00.000Z')
    expect(parsed.exercises).to.have.lengthOf(1)
  })

  it('exportedAt non inquina il reimport: il round-trip restituisce gli stessi dati', () => {
    const data = withExercise('Trazioni', 'https://youtu.be/dQw4w9WgXcQ')
    expect(importFromJson(exportBackupJson(data))).to.deep.equal(data)
  })

  it('il nome del file include la data locale', () => {
    expect(backupFileName('2026-07-11')).to.equal('open-gym-backup-2026-07-11.json')
  })
})

describe('unione del backup ai dati presenti (issue #24)', () => {
  /** Backup: Trazioni (stesso video del locale, link diverso) + Squat nuovo, scheda e sessioni. */
  function backupData(): AppData {
    let backup = withExercise('Trazioni', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    backup = withExercise('Squat', 'https://youtu.be/BBBBBBBBBBB', backup)
    backup = toggleVote(backup, backup.exercises[0].id) // voto sull'esercizio che collasserà
    backup = toggleVote(backup, backup.exercises[1].id) // voto sull'esercizio nuovo
    backup = createPlan(backup, 'Push Pull Legs')
    backup = addDay(backup, backup.plans[0].id, 'Lunedì')
    backup = addEntry(backup, backup.plans[0].id, 'Lunedì', {
      exerciseId: backup.exercises[0].id,
      sets: 3,
      reps: 8,
    })
    backup = recordSet(backup, backup.exercises[0].id, '2026-07-01', { weightKg: 80, reps: 8 })
    backup = recordSet(backup, backup.exercises[0].id, '2026-07-03', { weightKg: 82.5, reps: 8 })
    return setStature(backup, 180)
  }

  function localData(): AppData {
    let local = withExercise('Trazioni alla sbarra', 'https://youtu.be/dQw4w9WgXcQ')
    // Lo stesso giorno 2026-07-01 è già registrato localmente con un altro carico
    local = recordSet(local, local.exercises[0].id, '2026-07-01', { weightKg: 70, reps: 10 })
    return local
  }

  it('non duplica gli esercizi con lo stesso video e rimappa schede e sessioni', () => {
    const merged = mergeData(localData(), backupData())

    // Trazioni collassa su quella locale, Squat si aggiunge
    expect(merged.exercises.map((e) => e.name)).to.deep.equal(['Trazioni alla sbarra', 'Squat'])
    // La scheda del backup arriva e punta all'esercizio locale
    expect(merged.plans).to.have.lengthOf(1)
    expect(merged.plans[0].days[0].entries[0].exerciseId).to.equal(merged.exercises[0].id)
    // La sessione del 2026-07-01 resta quella locale; quella del 2026-07-03 si aggiunge
    const dates = merged.activity.map((a) => a.date).sort()
    expect(dates).to.deep.equal(['2026-07-01', '2026-07-03'])
    const day1 = merged.activity.find((a) => a.date === '2026-07-01')!
    expect(day1.sets).to.deep.equal([{ weightKg: 70, reps: 10 }])
  })

  it('una scheda con lo stesso nome non viene duplicata', () => {
    let local = localData()
    local = createPlan(local, 'Push Pull Legs')
    local = setActivePlan(local, local.plans[0].id)

    const merged = mergeData(local, backupData())

    expect(merged.plans).to.have.lengthOf(1)
    expect(merged.plans[0].days).to.have.lengthOf(0) // è rimasta la versione locale
    expect(merged.activePlanId).to.equal(local.activePlanId)
  })

  it('il voto del backup vale solo per gli esercizi davvero aggiunti', () => {
    const merged = mergeData(localData(), backupData())
    const squat = merged.exercises.find((e) => e.name === 'Squat')!

    // Squat arriva con il suo voto (contatore e flag coerenti)
    expect(merged.votedExerciseIds).to.deep.equal([squat.id])
    expect(squat.votes).to.equal(1)
    // Trazioni resta quella locale: 0 voti e nessun flag fantasma
    expect(merged.exercises[0].votes).to.equal(0)
  })

  it('la statura locale vince; se manca si prende quella del backup', () => {
    expect(mergeData(localData(), backupData()).profile.statureCm).to.equal(180)
    const localWithStature = setStature(localData(), 170)
    expect(mergeData(localWithStature, backupData()).profile.statureCm).to.equal(170)
  })

  it("l'unione con un backup vuoto non cambia nulla", () => {
    const local = localData()
    expect(mergeData(local, emptyData())).to.deep.equal(local)
  })
})
