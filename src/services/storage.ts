import type { AppData } from '../domain/types'
import { exportToJson, importFromJson } from './importExport'

export const STORAGE_KEY = 'open-gym-app/data'

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

export function emptyData(): AppData {
  return { schemaVersion: 1, exercises: [], plans: [], activity: [] }
}

/** Carica i dati da localStorage; dati assenti o corrotti → stato vuoto (mai un crash all'avvio). */
export function loadData(storage: StorageLike = localStorage): AppData {
  const raw = storage.getItem(STORAGE_KEY)
  if (raw === null) return emptyData()
  try {
    return importFromJson(raw)
  } catch {
    return emptyData()
  }
}

export function saveData(data: AppData, storage: StorageLike = localStorage): void {
  storage.setItem(STORAGE_KEY, exportToJson(data))
}
