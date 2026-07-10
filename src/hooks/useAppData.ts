import { useCallback, useEffect, useState } from 'react'
import { createExercise, upvoteExercise, type NewExercise } from '../domain/exercises'
import type { AppData } from '../domain/types'
import { exportToJson, importFromJson } from '../services/importExport'
import { loadData, saveData } from '../services/storage'

/** Stato dell'app sincronizzato con localStorage a ogni modifica. */
export function useAppData() {
  const [data, setData] = useState<AppData>(() => loadData())

  useEffect(() => {
    saveData(data)
  }, [data])

  // La validazione (che può lanciare) avviene fuori dall'updater di React.
  const addExercise = useCallback((input: NewExercise) => {
    const exercise = createExercise(input)
    setData((d) => ({ ...d, exercises: [...d.exercises, exercise] }))
  }, [])

  const upvote = useCallback((exerciseId: string) => {
    setData((d) => upvoteExercise(d, exerciseId))
  }, [])

  const importJson = useCallback((json: string) => {
    const imported = importFromJson(json)
    setData(imported)
  }, [])

  const exportJson = useCallback(() => exportToJson(data), [data])

  return { data, addExercise, upvote, importJson, exportJson }
}
