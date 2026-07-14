import { MAX_STATURE_CM, MIN_STATURE_CM } from './exercises'
import type { AppData } from './types'

export const INVALID_STATURE_ERROR = 'INVALID_STATURE'

/** Imposta la statura del profilo locale (serve al filtro "Adatti a me"). */
export function setStature(data: AppData, statureCm: number): AppData {
  if (!Number.isFinite(statureCm) || statureCm < MIN_STATURE_CM || statureCm > MAX_STATURE_CM) {
    throw new Error(INVALID_STATURE_ERROR)
  }
  return { ...data, profile: { ...data.profile, statureCm: Math.round(statureCm) } }
}
