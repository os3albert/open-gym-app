import { CURRENT_SCHEMA_VERSION } from '../domain/types'

/**
 * Porta un backup/store di una versione precedente alla forma della versione corrente.
 * Riceve e restituisce dati grezzi (unknown): la validazione strutturale avviene dopo,
 * in importFromJson, sempre sulla forma corrente.
 */
export function migrateToCurrentSchema(parsed: Record<string, unknown>): Record<string, unknown> {
  let data = parsed
  if (data.schemaVersion === 1) data = migrateV1toV2(data)
  return data
}

/** v1 → v2: aggiunge profilo locale, voti del dispositivo e flag volto offuscato. */
function migrateV1toV2(v1: Record<string, unknown>): Record<string, unknown> {
  const exercises = Array.isArray(v1.exercises)
    ? v1.exercises.map((e) =>
        typeof e === 'object' && e !== null ? { faceBlurConfirmed: false, ...e } : e,
      )
    : v1.exercises
  return {
    ...v1,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exercises,
    profile: { statureCm: null },
    votedExerciseIds: [],
  }
}
