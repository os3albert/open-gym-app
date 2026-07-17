import { useCallback, useState } from 'react'
import { recordSet, removeSet } from '../domain/activity'
import {
  createExercise,
  deleteExercise,
  toggleVote,
  updateExercise,
  type NewExercise,
} from '../domain/exercises'
import {
  addDay,
  addEntry,
  createPlan,
  deletePlan,
  moveEntry,
  removeDay,
  removeEntry,
  renamePlan,
  setActivePlan,
} from '../domain/plans'
import type { Exercise, PlanEntry, WorkoutSet } from '../domain/types'
import { setStature } from '../domain/profile'
import type { AppData } from '../domain/types'
import { exportBackupJson, importFromJson, mergeData } from '../services/importExport'
import { applySharedPayload, ensureLocalExercise, type SharePayload } from '../services/share'
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
    addSet: (exerciseId: string, date: string, set: WorkoutSet) =>
      commit(recordSet(data, exerciseId, date, set)),
    /**
     * Conferma nello storico le serie in bozza (M17): l'inserimento nello storico è un gesto
     * ESPLICITO, non un effetto collaterale del tick. Più esercizi in UN SOLO commit: due
     * chiamate consecutive partirebbero dallo stesso `data` e si sovrascriverebbero.
     */
    confirmSets: (date: string, entries: Array<{ exerciseId: string; sets: WorkoutSet[] }>) => {
      let next = data
      for (const { exerciseId, sets } of entries) {
        for (const set of sets) next = recordSet(next, exerciseId, date, set)
      }
      commit(next)
    },
    deleteSet: (recordId: string, setIndex: number) => commit(removeSet(data, recordId, setIndex)),
    /** Registra in un colpo solo le N serie di un esercizio della scheda («Fatto ✓»). */
    completeEntry: (exerciseId: string, date: string, sets: number, set: WorkoutSet) => {
      let next = data
      for (let i = 0; i < sets; i++) next = recordSet(next, exerciseId, date, set)
      commit(next)
    },
    createPlan: (name: string) => commit(createPlan(data, name)),
    renamePlan: (planId: string, name: string) => commit(renamePlan(data, planId, name)),
    removePlan: (planId: string) => commit(deletePlan(data, planId)),
    activatePlan: (planId: string | null) => commit(setActivePlan(data, planId)),
    addPlanDay: (planId: string, dayName: string) => commit(addDay(data, planId, dayName)),
    removePlanDay: (planId: string, dayName: string) => commit(removeDay(data, planId, dayName)),
    addPlanEntry: (planId: string, dayName: string, entry: PlanEntry) =>
      commit(addEntry(data, planId, dayName, entry)),
    /**
     * Mette nella scheda un esercizio scelto dalla Community (M15). Quelle voci vengono dal
     * catalogo pubblico e non sono fra i miei: prima se ne assicura una copia locale (riusando
     * quella che ha già lo stesso video), poi la si aggiunge al giorno. Se `addEntry` lancia,
     * lancia PRIMA del commit: nessun esercizio resta appeso senza la sua entry.
     */
    addExerciseToPlan: (
      exercise: Exercise,
      planId: string,
      dayName: string,
      target: { sets: number; reps: number },
    ) => {
      const { data: withExercise, exerciseId } = ensureLocalExercise(data, exercise)
      commit(addEntry(withExercise, planId, dayName, { exerciseId, ...target }))
    },
    removePlanEntry: (planId: string, dayName: string, exerciseId: string) =>
      commit(removeEntry(data, planId, dayName, exerciseId)),
    movePlanEntry: (planId: string, dayName: string, exerciseId: string, direction: -1 | 1) =>
      commit(moveEntry(data, planId, dayName, exerciseId, direction)),
    /** Importa un pacchetto condiviso; se era una scheda ritorna l'id per «Prova questa scheda». */
    importShared: (payload: SharePayload): string | undefined => {
      const result = applySharedPayload(data, payload)
      commit(result.data)
      return result.planId
    },
    /** Ripristino completo: i dati dell'app diventano quelli del backup. */
    importJson: (json: string) => commit(importFromJson(json)),
    /** Unione: il backup si aggiunge ai dati presenti senza duplicati. */
    mergeJson: (json: string) => commit(mergeData(data, importFromJson(json))),
    exportJson: () => exportBackupJson(data),
  }
}
