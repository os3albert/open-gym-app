import { useEffect, useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import Alert from '@mui/material/Alert'
import AppBar from '@mui/material/AppBar'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'
import Container from '@mui/material/Container'
import CssBaseline from '@mui/material/CssBaseline'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { ThemeProvider, useColorScheme } from '@mui/material/styles'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { theme as muiTheme } from './theme'
import { BackupPanel } from './components/BackupPanel'
import { ExerciseForm } from './components/ExerciseForm'
import { ExerciseList } from './components/ExerciseList'
import { FilterBar } from './components/FilterBar'
import { HistoryView } from './components/HistoryView'
import { PlansView } from './components/PlansView'
import { TabNav } from './components/TabNav'
import { TodayWorkout } from './components/TodayWorkout'
import { UpdateBanner } from './components/UpdateBanner'
import { WorkoutSession } from './components/WorkoutSession'
import type { NewExercise } from './domain/exercises'
import { applyFilters, muscleGroups, suitabilityRequiresStature } from './domain/filters'
import type { Exercise } from './domain/types'
import { useAppData } from './hooks/useAppData'
import { useFilters } from './hooks/useFilters'
import { useTheme, type ThemePreference } from './hooks/useTheme'
import { useView } from './hooks/useView'
import { shareCodeFromHash } from './services/share'
import { todayIso } from './utils/date'

/**
 * Specchia il tema risolto da useTheme nel color scheme di MUI: il provider riscrive
 * data-theme per conto suo (al mount e sui cambi di stato), e senza questo ponte
 * al ricaricamento sovrascriverebbe la preferenza dell'utente col tema di sistema.
 */
function SyncMuiColorScheme({ resolved }: { resolved: 'light' | 'dark' }) {
  const { mode, setMode } = useColorScheme()
  useEffect(() => {
    if (mode !== resolved) setMode(resolved)
  }, [mode, resolved, setMode])
  return null
}

/** Legge (e consuma) il codice condiviso dal fragment #dati=…, per l'apertura da link. */
function consumeShareCodeFromUrl(): string | null {
  const code = shareCodeFromHash(window.location.hash)
  if (code) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
  }
  return code
}

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
    completeEntry,
    createPlan,
    renamePlan,
    removePlan,
    activatePlan,
    addPlanDay,
    removePlanDay,
    addPlanEntry,
    removePlanEntry,
    movePlanEntry,
    importShared,
    importJson,
    mergeJson,
    exportJson,
  } = useAppData()
  const [initialShareCode] = useState(consumeShareCodeFromUrl)
  // Chi apre un link di condivisione atterra direttamente sulla vista Schede
  const [view, setView] = useView(initialShareCode ? 'schede' : 'esercizi')
  const [filters, setFilters] = useFilters()
  const [theme, setTheme, resolvedTheme] = useTheme()
  const [editing, setEditing] = useState<Exercise | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [statureError, setStatureError] = useState<string | null>(null)
  // Il form di proposta è chiuso all'atterraggio: la lista della community viene prima
  const [formOpen, setFormOpen] = useState(false)

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
    setFormError(null)
  }

  function handleSubmitExercise(input: NewExercise): boolean {
    try {
      if (editing) {
        // Salvata la modifica il pannello si richiude; proponendo si resta pronti al prossimo
        editExercise(editing.id, input)
        setEditing(null)
        setFormOpen(false)
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
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <SyncMuiColorScheme resolved={resolvedTheme} />
      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', gap: 2 }}>
          <Typography variant="h1">🏋️ Open Gym</Typography>
          <TextField
            select
            label="Tema"
            value={theme}
            onChange={(e) => setTheme(e.target.value as ThemePreference)}
            slotProps={{
              select: { native: true },
              inputLabel: { shrink: true },
              htmlInput: { 'data-cy': 'theme-select' },
            }}
            sx={{ minWidth: 110 }}
          >
            <option value="auto">Auto</option>
            <option value="chiaro">Chiaro</option>
            <option value="scuro">Scuro</option>
          </TextField>
        </Toolbar>
      </AppBar>
      <Container
        component="main"
        maxWidth="md"
        sx={{ py: 3, pb: 14, display: 'flex', flexDirection: 'column', gap: 3 }}
      >
        <UpdateBanner />
        <Typography variant="body2" color="text.secondary">
          Esercizi proposti dalla community, votati come su Reddit. Nessuna registrazione: i dati
          restano sul tuo dispositivo.
        </Typography>
        {corruptedAtStartup && (
          <Alert severity="warning" role="alert" data-cy="corrupted-banner">
            I dati salvati su questo dispositivo non erano leggibili: si riparte da zero. Se hai un
            backup JSON puoi ripristinarlo dalla sezione «Backup dei dati».
          </Alert>
        )}
        {saveError && (
          <Alert severity="error" role="alert" data-cy="storage-error">
            {saveError}
          </Alert>
        )}
        {view === 'esercizi' && (
          <section>
            <Stack
              direction="row"
              spacing={2}
              useFlexGap
              sx={{
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <Typography variant="h2">Esercizi della community</Typography>
              <Button
                variant="contained"
                startIcon={formOpen ? <CloseIcon /> : <AddIcon />}
                data-cy="propose-toggle"
                aria-expanded={formOpen}
                onClick={() => (formOpen ? closeForm() : setFormOpen(true))}
              >
                {/* Non «Proponi esercizio»: è il nome del submit del form, le query per ruolo collidono */}
                {formOpen ? 'Chiudi il form' : 'Nuova proposta'}
              </Button>
            </Stack>
            <Collapse in={formOpen} unmountOnExit sx={{ mb: 3 }}>
              <ExerciseForm
                key={editing?.id ?? 'new'}
                initial={editing}
                onSubmit={handleSubmitExercise}
                onCancel={closeForm}
                error={formError}
              />
            </Collapse>
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
                setFormOpen(true)
              }}
              onDelete={removeExercise}
            />
          </section>
        )}
        {view === 'schede' && (
          <PlansView
            data={data}
            initialShareCode={initialShareCode}
            actions={{
              createPlan,
              renamePlan,
              removePlan,
              activatePlan,
              addPlanDay,
              removePlanDay,
              addPlanEntry,
              removePlanEntry,
              movePlanEntry,
              importShared,
            }}
          />
        )}
        {view === 'allenamento' && (
          <>
            <TodayWorkout
              data={data}
              today={todayIso()}
              onComplete={(exerciseId, sets, set) =>
                completeEntry(exerciseId, todayIso(), sets, set)
              }
            />
            <WorkoutSession
              data={data}
              today={todayIso()}
              onAddSet={(exerciseId, set) => addSet(exerciseId, todayIso(), set)}
              onRemoveSet={deleteSet}
            />
          </>
        )}
        {view === 'storico' && <HistoryView data={data} />}
        <BackupPanel onExport={exportJson} onReplace={importJson} onMerge={mergeJson} />
      </Container>
      <TabNav view={view} onChange={setView} />
    </ThemeProvider>
  )
}
