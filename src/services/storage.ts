import type { AppData } from '../domain/types'
import { CURRENT_SCHEMA_VERSION } from '../domain/types'
import { exportToJson, importFromJson } from './importExport'

export const STORAGE_KEY = 'open-gym-app/data'
export const STORAGE_FULL_ERROR = 'STORAGE_FULL'

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

export function emptyData(): AppData {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exercises: [],
    plans: [],
    activePlanId: null,
    activity: [],
    profile: { statureCm: null },
    votedExerciseIds: [],
  }
}

export interface LoadResult {
  data: AppData
  /**
   * ok: dati letti (e migrati se serviva) · empty: primo avvio ·
   * corrupted: contenuto illeggibile, si riparte da vuoto e la UI propone il ripristino da backup
   */
  status: 'ok' | 'empty' | 'corrupted'
}

/** Carica i dati da localStorage senza mai lanciare: l'esito guida la UI. */
export function loadDataResult(storage: StorageLike = localStorage): LoadResult {
  const raw = storage.getItem(STORAGE_KEY)
  if (raw === null) return { status: 'empty', data: emptyData() }
  try {
    return { status: 'ok', data: importFromJson(raw) }
  } catch {
    return { status: 'corrupted', data: emptyData() }
  }
}

export function loadData(storage: StorageLike = localStorage): AppData {
  return loadDataResult(storage).data
}

function isQuotaError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  )
}

/** Salva su localStorage; se la quota è esaurita lancia STORAGE_FULL_ERROR (mai dati persi in silenzio). */
export function saveData(data: AppData, storage: StorageLike = localStorage): void {
  try {
    storage.setItem(STORAGE_KEY, exportToJson(data))
  } catch (error) {
    if (isQuotaError(error)) throw new Error(STORAGE_FULL_ERROR, { cause: error })
    throw error
  }
}
