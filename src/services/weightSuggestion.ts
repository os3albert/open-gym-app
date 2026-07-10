import type { ActivityRecord } from '../domain/types'

/** Incremento proposto quando l'ultima sessione è andata a buon fine. */
export const WEIGHT_INCREMENT_KG = 2.5
/** Ripetizioni obiettivo: sotto questa soglia si consolida il peso invece di aumentarlo. */
export const TARGET_REPS = 8

/**
 * Suggerisce il peso per un esercizio in base allo storico:
 * - nessuna sessione registrata → null (nessun suggerimento possibile)
 * - ultima sessione con tutte le serie ≥ TARGET_REPS → peso massimo + WEIGHT_INCREMENT_KG
 * - altrimenti → stesso peso massimo dell'ultima sessione (consolidamento)
 */
export function suggestNextWeight(activity: ActivityRecord[], exerciseId: string): number | null {
  const sessions = activity.filter((a) => a.exerciseId === exerciseId && a.sets.length > 0)
  if (sessions.length === 0) return null

  const latest = sessions.reduce((a, b) => (a.date >= b.date ? a : b))
  const maxWeight = Math.max(...latest.sets.map((s) => s.weightKg))
  const targetReached = latest.sets.every((s) => s.reps >= TARGET_REPS)

  return targetReached ? maxWeight + WEIGHT_INCREMENT_KG : maxWeight
}
