import { useState } from 'react'
import { BackupPanel } from './components/BackupPanel'
import { ExerciseForm } from './components/ExerciseForm'
import { ExerciseList } from './components/ExerciseList'
import { FilterBar } from './components/FilterBar'
import { HistoryView } from './components/HistoryView'
import { TabNav } from './components/TabNav'
import { WorkoutSession } from './components/WorkoutSession'
import type { NewExercise } from './domain/exercises'
import { applyFilters, muscleGroups, suitabilityRequiresStature } from './domain/filters'
import type { Exercise } from './domain/types'
import { useAppData } from './hooks/useAppData'
import { useFilters } from './hooks/useFilters'
import { useView } from './hooks/useView'
import { todayIso } from './utils/date'

export default function App() {
  const {
    data,
    corruptedAtStartup,
    saveError,
    addExercise,
    editExercise,
    removeExercise,
    vote,
    saveStature,
    addSet,
    deleteSet,
    importJson,
    exportJson,
  } = useAppData()
  const [view, setView] = useView()
  const [filters, setFilters] = useFilters()
  const [editing, setEditing] = useState<Exercise | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [statureError, setStatureError] = useState<string | null>(null)

  function handleSubmitExercise(input: NewExercise): boolean {
    try {
      if (editing) {
        editExercise(editing.id, input)
        setEditing(null)
      } else {
        addExercise(input)
      }
      setFormError(null)
      return true
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Dati non validi')
      return false
    }
  }

  function handleSaveStature(statureCm: number) {
    try {
      saveStature(statureCm)
      setStatureError(null)
    } catch (error) {
      setStatureError(error instanceof Error ? error.message : 'Statura non valida')
    }
  }

  const visibleExercises = applyFilters(data, filters)

  return (
    <main className="container">
      <header>
        <h1>🏋️ Open Gym</h1>
        <p className="tagline">
          Esercizi proposti dalla community, votati come su Reddit. Nessuna registrazione: i dati
          restano sul tuo dispositivo.
        </p>
      </header>
      {corruptedAtStartup && (
        <p className="banner-warning" role="alert" data-cy="corrupted-banner">
          I dati salvati su questo dispositivo non erano leggibili: si riparte da zero. Se hai un
          backup JSON puoi ripristinarlo dalla sezione «Backup dei dati».
        </p>
      )}
      {saveError && (
        <p className="banner-error" role="alert" data-cy="storage-error">
          {saveError}
        </p>
      )}
      <TabNav view={view} onChange={setView} />
      {view === 'esercizi' && (
        <>
          <ExerciseForm
            key={editing?.id ?? 'new'}
            initial={editing}
            onSubmit={handleSubmitExercise}
            onCancel={() => {
              setEditing(null)
              setFormError(null)
            }}
            error={formError}
          />
          <section className="card">
            <h2>Esercizi della community</h2>
            <FilterBar
              filters={filters}
              onFiltersChange={setFilters}
              muscleGroups={muscleGroups(data.exercises)}
              statureCm={data.profile.statureCm}
              onSaveStature={handleSaveStature}
              statureError={statureError}
              requiresStature={suitabilityRequiresStature(filters, data)}
            />
            <ExerciseList
              exercises={visibleExercises}
              totalCount={data.exercises.length}
              votedIds={new Set(data.votedExerciseIds)}
              onToggleVote={vote}
              onEdit={(exercise) => {
                setFormError(null)
                setEditing(exercise)
              }}
              onDelete={removeExercise}
            />
          </section>
        </>
      )}
      {view === 'allenamento' && (
        <WorkoutSession
          data={data}
          today={todayIso()}
          onAddSet={(exerciseId, set) => addSet(exerciseId, todayIso(), set)}
          onRemoveSet={deleteSet}
        />
      )}
      {view === 'storico' && <HistoryView data={data} />}
      <BackupPanel onExport={exportJson} onImport={importJson} />
    </main>
  )
}
