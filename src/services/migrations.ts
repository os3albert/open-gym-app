/**
 * Porta un backup/store di una versione precedente alla forma della versione corrente.
 * Riceve e restituisce dati grezzi (unknown): la validazione strutturale avviene dopo,
 * in importFromJson, sempre sulla forma corrente. Le migrazioni si applicano in catena.
 */
export function migrateToCurrentSchema(parsed: Record<string, unknown>): Record<string, unknown> {
  let data = parsed
  if (data.schemaVersion === 1) data = migrateV1toV2(data)
  if (data.schemaVersion === 2) data = migrateV2toV3(data)
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
    schemaVersion: 2,
    exercises,
    profile: { statureCm: null },
    votedExerciseIds: [],
  }
}

/**
 * v2 → v3: i giorni delle schede passano da `exerciseIds` a `entries` con target
 * di serie e ripetizioni (default 3×8) e nasce la scheda attiva del dispositivo.
 */
function migrateV2toV3(v2: Record<string, unknown>): Record<string, unknown> {
  const plans = Array.isArray(v2.plans)
    ? v2.plans.map((plan) => {
        if (typeof plan !== 'object' || plan === null) return plan
        const days = Array.isArray((plan as Record<string, unknown>).days)
          ? ((plan as Record<string, unknown>).days as unknown[]).map(migrateDayV2toV3)
          : (plan as Record<string, unknown>).days
        return { ...plan, days }
      })
    : v2.plans
  return { ...v2, schemaVersion: 3, plans, activePlanId: null }
}

function migrateDayV2toV3(day: unknown): unknown {
  if (typeof day !== 'object' || day === null) return day
  const { exerciseIds, ...rest } = day as Record<string, unknown>
  const entries = Array.isArray(exerciseIds)
    ? exerciseIds
        .filter((id): id is string => typeof id === 'string')
        .map((exerciseId) => ({ exerciseId, sets: 3, reps: 8 }))
    : []
  return { ...rest, entries }
}
