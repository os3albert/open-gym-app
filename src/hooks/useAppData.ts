import { useCallback, useState } from 'react'
import {
  createExercise,
  deleteExercise,
  toggleVote,
  updateExercise,
  type NewExercise,
} from '../domain/exercises'
import { setStature } from '../domain/profile'
import type { AppData } from '../domain/types'
import { exportToJson, importFromJson } from '../services/importExport'
import { loadDataResult, saveData } from '../services/storage'

/**
 * Stato dell'app sincronizzato con localStorage: ogni modifica passa da commit(),
 * che salva subito e rispecchia l'eventuale errore di quota. Non si salva mai al mount:
 * se i dati erano corrotti restano su disco finché l'utente non agisce.
 */
export function useAppData() {
  const [initial] = useState(() => loadDataResult())
  const [data, setData] = useState<AppData>(initial.data)
  const [saveError, setSaveError] = useState<string | null>(null)

  const commit = useCallback((next: AppData) => {
    setData(next)
    try {
      saveData(next)
      setSaveError(null)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Salvataggio non riuscito')
    }
  }, [])

  // La validazione nel dominio può lanciare: l'errore risale al chiamante (che lo mostra nel form).
  return {
    data,
    /** true se all'avvio i dati in localStorage erano illeggibili (si riparte da vuoto). */
    corruptedAtStartup: initial.status === 'corrupted',
    saveError,
    addExercise: (input: NewExercise) => {
      const exercise = createExercise(input)
      commit({ ...data, exercises: [...data.exercises, exercise] })
    },
    editExercise: (exerciseId: string, input: NewExercise) =>
      commit(updateExercise(data, exerciseId, input)),
    removeExercise: (exerciseId: string) => commit(deleteExercise(data, exerciseId)),
    vote: (exerciseId: string) => commit(toggleVote(data, exerciseId)),
    saveStature: (statureCm: number) => commit(setStature(data, statureCm)),
    importJson: (json: string) => commit(importFromJson(json)),
    exportJson: () => exportToJson(data),
  }
}
