import { useState } from 'react'
import { BackupPanel } from './components/BackupPanel'
import { ExerciseForm } from './components/ExerciseForm'
import { ExerciseList } from './components/ExerciseList'
import type { NewExercise } from './domain/exercises'
import { useAppData } from './hooks/useAppData'

export default function App() {
  const { data, addExercise, upvote, importJson, exportJson } = useAppData()
  const [formError, setFormError] = useState<string | null>(null)

  function handleNewExercise(input: NewExercise): boolean {
    try {
      addExercise(input)
      setFormError(null)
      return true
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Dati non validi')
      return false
    }
  }

  return (
    <main className="container">
      <header>
        <h1>🏋️ Open Gym</h1>
        <p className="tagline">
          Esercizi proposti dalla community, votati come su Reddit. Nessuna registrazione: i dati
          restano sul tuo dispositivo.
        </p>
      </header>
      <ExerciseForm onSubmit={handleNewExercise} error={formError} />
      <ExerciseList exercises={data.exercises} onUpvote={upvote} />
      <BackupPanel onExport={exportJson} onImport={importJson} />
    </main>
  )
}
