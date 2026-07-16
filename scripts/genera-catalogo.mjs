// Genera le voci di catalogo per community/exercises.json dal dataset Gym visual.
//
//   node --import tsx scripts/genera-catalogo.mjs
//
// (tsx perché la mappatura vive in src/services/datasetCatalog.ts, condivisa coi test unit.)
//
// Si lancia A MANO, una tantum (o per aggiornare il catalogo): scarica il dataset a un commit
// PINNATO — le GIF restano linkate a quel commit, così un cambiamento a monte non cambia l'app
// sotto i piedi — e fonde le voci nel community/exercises.json esistente, preservando le
// proposte vere degli utenti. votes.json non si tocca.
//
// Licenza: dati e istruzioni del dataset sono MIT; le GIF sono © Gym visual, ridistribuite nel
// repo del dataset con permesso scritto (180×180, attribuzione obbligatoria). Per questo si
// LINKANO da lì e non si copiano qui: l'app mostra l'attribuzione accanto a ogni GIF.

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mapDatasetMuscleGroup, trimInstructions } from '../src/services/datasetCatalog.ts'

const DATASET_REPO = 'hasaneyldrm/exercises-dataset'
const DATASET_COMMIT = '7455efae41b330c265e7cd4b78dfa848e7ce5ebd'
const RAW_BASE = `https://raw.githubusercontent.com/${DATASET_REPO}/${DATASET_COMMIT}`

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const catalogPath = path.join(root, 'community', 'exercises.json')

console.log(`Scarico il dataset (${DATASET_COMMIT.slice(0, 7)})…`)
const response = await fetch(`${RAW_BASE}/data/exercises.json`)
if (!response.ok) throw new Error(`Dataset non raggiungibile: ${response.status}`)
const dataset = await response.json()
console.log(`${dataset.length} esercizi nel dataset`)

const fromDataset = dataset.map((record) => ({
  id: `gv-${record.id}`,
  name: record.name,
  description: trimInstructions(record.instructions.it ?? record.instructions.en ?? ''),
  youtubeUrl: '',
  gifUrl: `${RAW_BASE}/${record.gif_url}`,
  attribution: record.attribution,
  muscleGroup: mapDatasetMuscleGroup(record.target, record.body_part),
  faceBlurConfirmed: false,
  createdAt: record.created_at,
}))

const existing = JSON.parse(await readFile(catalogPath, 'utf8'))
// Le proposte vere degli utenti restano; le voci gv-* si rigenerano da zero
const proposals = existing.filter((e) => !e.id.startsWith('gv-'))
const merged = [...proposals, ...fromDataset]

await writeFile(catalogPath, `${JSON.stringify(merged, null, 2)}\n`)
console.log(
  `Scritte ${merged.length} voci in community/exercises.json ` +
    `(${proposals.length} proposte utente + ${fromDataset.length} dal catalogo)`,
)
