import type { MuscleGroup } from '../domain/types'

/**
 * Mappatura dal vocabolario del dataset Gym visual (github.com/hasaneyldrm/exercises-dataset)
 * ai nostri gruppi muscolari. Funzioni pure: le usa lo script `scripts/genera-catalogo.mjs`
 * che produce le voci per community/exercises.json, e i test unit le tengono oneste.
 *
 * Prima si guarda il muscolo bersaglio (`target`, più preciso: «glutes» sta in «upper legs»
 * ma non è «legs»), poi la parte del corpo (`body_part`) come rete. L'ignoto finisce su
 * «other»: un catalogo non deve MAI rifiutare un record per una parola nuova.
 */
const BY_TARGET: Record<string, MuscleGroup> = {
  abs: 'core',
  spine: 'core',
  pectorals: 'chest',
  'serratus anterior': 'chest',
  biceps: 'arms',
  triceps: 'arms',
  forearms: 'arms',
  delts: 'shoulders',
  traps: 'back',
  lats: 'back',
  'upper back': 'back',
  glutes: 'glutes',
  quads: 'legs',
  hamstrings: 'legs',
  adductors: 'legs',
  abductors: 'legs',
  calves: 'calves',
  'cardiovascular system': 'fullBody',
  'levator scapulae': 'other',
}

const BY_BODY_PART: Record<string, MuscleGroup> = {
  waist: 'core',
  chest: 'chest',
  back: 'back',
  shoulders: 'shoulders',
  'upper arms': 'arms',
  'lower arms': 'arms',
  'upper legs': 'legs',
  'lower legs': 'calves',
  cardio: 'fullBody',
  neck: 'other',
}

export function mapDatasetMuscleGroup(target: string, bodyPart: string): MuscleGroup {
  return BY_TARGET[target] ?? BY_BODY_PART[bodyPart] ?? 'other'
}

/**
 * La descrizione della voce di catalogo: le istruzioni italiane del dataset, troncate a misura
 * di card (e comunque entro FIELD_LIMITS.description). Il taglio cade a fine parola, con
 * l'ellissi a dire che c'è dell'altro.
 */
export function trimInstructions(instructions: string, maxLength = 300): string {
  const text = instructions.trim().replace(/\s+/g, ' ')
  if (text.length <= maxLength) return text
  const cut = text.slice(0, maxLength)
  const lastSpace = cut.lastIndexOf(' ')
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : maxLength)}…`
}
