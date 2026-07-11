import { Given, Then, When } from '@cucumber/cucumber'
import { expect } from 'chai'
import { addExercise } from '../../src/domain/exercises'
import type { AppData } from '../../src/domain/types'
import {
  backupFileName,
  exportBackupJson,
  importFromJson,
  mergeData,
} from '../../src/services/importExport'
import { emptyData } from '../../src/services/storage'
import type { GymWorld } from '../support/world'

function videoIdFor(name: string): string {
  return name
    .replace(/[^A-Za-z0-9_-]/g, '')
    .padEnd(11, 'x')
    .slice(0, 11)
}

function withExercise(data: AppData, name: string, youtubeUrl: string): AppData {
  return addExercise(data, {
    name,
    description: '',
    youtubeUrl,
    muscleGroup: '',
    faceBlurConfirmed: true,
  })
}

Given("che ho l'esercizio {string} nei miei dati", function (this: GymWorld, name: string) {
  this.data = withExercise(this.data, name, `https://youtu.be/${videoIdFor(name)}`)
})

Given(
  "che ho l'esercizio {string} nei miei dati con lo stesso video",
  function (this: GymWorld, name: string) {
    // Stesso video del backup ma in forma watch?v=…: il dedup è sul video
    this.data = withExercise(this.data, name, `https://www.youtube.com/watch?v=${videoIdFor(name)}`)
  },
)

Given("un file di backup con l'esercizio {string}", function (this: GymWorld, name: string) {
  const backup = withExercise(emptyData(), name, `https://youtu.be/${videoIdFor(name)}`)
  this.backupJson = exportBackupJson(backup)
})

Given('un file di backup corrotto', function (this: GymWorld) {
  this.backupJson = '{"schemaVersion": 99, "sorpresa": true}'
})

When('esporto il backup in data {word}', function (this: GymWorld, dateIso: string) {
  this.backupJson = exportBackupJson(this.data, new Date(`${dateIso}T12:00:00Z`))
  this.viewedDate = dateIso
})

When('importo il backup scegliendo di sostituire tutto', function (this: GymWorld) {
  this.data = importFromJson(this.backupJson!)
})

When('importo il backup scegliendo di unire', function (this: GymWorld) {
  this.data = mergeData(this.data, importFromJson(this.backupJson!))
})

When('provo a importare il file di backup', function (this: GymWorld) {
  this.snapshot = this.data
  try {
    this.data = importFromJson(this.backupJson!)
    this.error = null
  } catch (error) {
    this.error = error instanceof Error ? error.message : String(error)
  }
})

Then('il file di backup si chiama {string}', function (this: GymWorld, expected: string) {
  expect(backupFileName(this.viewedDate!)).to.equal(expected)
})

Then(
  "il backup contiene l'esercizio {string}, la versione dello schema e la data di export",
  function (this: GymWorld, name: string) {
    const parsed = JSON.parse(this.backupJson!) as {
      schemaVersion: number
      exportedAt: string
      exercises: Array<{ name: string }>
    }
    expect(parsed.exercises.map((e) => e.name)).to.include(name)
    expect(parsed.schemaVersion).to.equal(this.data.schemaVersion)
    expect(parsed.exportedAt).to.be.a('string')
  },
)

Then('i miei dati corrispondono esattamente al backup', function (this: GymWorld) {
  expect(this.data).to.deep.equal(importFromJson(this.backupJson!))
})

Then('ho un solo esercizio {string}', function (this: GymWorld, name: string) {
  expect(this.data.exercises.filter((e) => e.name === name)).to.have.lengthOf(1)
})

Then("ho ancora l'esercizio {string}", function (this: GymWorld, name: string) {
  expect(this.data.exercises.some((e) => e.name === name)).to.equal(true)
})

Then('i miei dati restano invariati', function (this: GymWorld) {
  expect(this.data).to.deep.equal(this.snapshot)
})
