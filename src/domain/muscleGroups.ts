import { isMuscleGroup, type MuscleGroup } from './types'

/**
 * Sinonimi riconosciuti, in italiano e in inglese. È la tabella che permette di chiudere su una
 * lista un campo che per tre milestone è stato testo libero: i dati là fuori dicono «Petto»,
 * «petto», «PETTO», «Dorso», «Chest»… e sono tutti la stessa cosa.
 */
const SYNONYMS: Record<string, MuscleGroup> = {
  petto: 'chest',
  pettorali: 'chest',
  chest: 'chest',
  schiena: 'back',
  dorso: 'back',
  dorsali: 'back',
  back: 'back',
  lats: 'back',
  gambe: 'legs',
  quadricipiti: 'legs',
  legs: 'legs',
  quads: 'legs',
  spalle: 'shoulders',
  deltoidi: 'shoulders',
  shoulders: 'shoulders',
  delts: 'shoulders',
  braccia: 'arms',
  bicipiti: 'arms',
  tricipiti: 'arms',
  arms: 'arms',
  biceps: 'arms',
  triceps: 'arms',
  core: 'core',
  addome: 'core',
  addominali: 'core',
  abs: 'core',
  glutei: 'glutes',
  glutes: 'glutes',
  polpacci: 'calves',
  calves: 'calves',
  'full body': 'fullBody',
  fullbody: 'fullBody',
  'total body': 'fullBody',
  corpo_libero: 'fullBody',
}

/**
 * Porta un gruppo muscolare scritto a mano sul suo codice: minuscole, accenti e spazi non contano.
 * Ciò che non si riconosce finisce su «other» — meglio un esercizio in «Altro» che un esercizio
 * perso o un import che fallisce.
 */
export function normalizeMuscleGroup(value: unknown): MuscleGroup {
  if (isMuscleGroup(value)) return value
  if (typeof value !== 'string') return 'other'
  const key = value
    .trim()
    .toLowerCase()
    // Via gli accenti: «Pèttorali» e «Pettorali» sono la stessa parola
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  return SYNONYMS[key] ?? 'other'
}
