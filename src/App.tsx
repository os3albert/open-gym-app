import { useEffect, useMemo, useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import Alert from '@mui/material/Alert'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'
import Container from '@mui/material/Container'
import CssBaseline from '@mui/material/CssBaseline'
import Stack from '@mui/material/Stack'
import { ThemeProvider, useColorScheme } from '@mui/material/styles'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { theme as muiTheme } from './theme'
import { makeTranslate, translateError, type Translate } from './i18n'
import { I18nProvider } from './i18n/provider'
import { useLanguage } from './hooks/useLanguage'
import { ExerciseForm } from './components/ExerciseForm'
import { ExerciseList } from './components/ExerciseList'
import { FilterBar } from './components/FilterBar'
import { HistoryView } from './components/HistoryView'
import { InstallPanel } from './components/InstallPanel'
import { Logo } from './components/Logo'
import { PlansView } from './components/PlansView'
import { PrivacyPanel } from './components/PrivacyPanel'
import { SettingsView } from './components/SettingsView'
import { TabNav } from './components/TabNav'
import { TodayWorkout } from './components/TodayWorkout'
import { UpdateBanner } from './components/UpdateBanner'
import { WorkoutSession } from './components/WorkoutSession'
import type { NewExercise } from './domain/exercises'
import { applyFiltersTo, muscleGroups, suitabilityRequiresStature } from './domain/filters'
import type { Exercise } from './domain/types'
import { useAnalytics } from './hooks/useAnalytics'
import { useAppData } from './hooks/useAppData'
import { useCommunity, type CommunityMessage } from './hooks/useCommunity'
import { useFilters } from './hooks/useFilters'
import { useTheme } from './hooks/useTheme'
import { useView } from './hooks/useView'
import { mergeForDisplay } from './services/community'
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

/** Riquadro di sintesi in cima: tre numeri sullo stato dei dati locali. */
function HeroStats({ items }: { items: Array<{ label: string; value: number }> }) {
  return (
    <Stack direction="row" spacing={1} sx={{ mt: 2.5 }}>
      {items.map((item) => (
        <Box
          key={item.label}
          sx={{
            flex: 1,
            minWidth: 0,
            px: 1.5,
            py: 1.25,
            borderRadius: '14px',
            bgcolor: 'background.default',
            border: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="h3" component="p" sx={{ lineHeight: 1.1 }}>
            {item.value}
          </Typography>
          <Typography
            variant="overline"
            component="p"
            color="text.secondary"
            sx={{ whiteSpace: 'nowrap', fontSize: '0.625rem' }}
          >
            {item.label}
          </Typography>
        </Box>
      ))}
    </Stack>
  )
}

/** La frase di un esito della community: l'hook dà un codice, la lingua la sceglie qui. */
function communityMessageText(t: Translate, message: CommunityMessage): string {
  if (message.kind === 'proposalSent') return t('community.proposalSent')
  const reason = translateError(t, message.reason)
  return message.kind === 'localOnly' ? t('community.localOnly', { reason }) : reason
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
  const [language, setLanguage] = useLanguage()
  // App traduce da sé (è la radice: sopra di lei non c'è provider) e passa la stessa
  // funzione ai discendenti tramite I18nProvider
  const t = useMemo(() => makeTranslate(language), [language])
  const community = useCommunity()
  const analytics = useAnalytics(view)
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
        // La proposta è già salvata in locale: l'invio alla community è un extra, mai un blocco
        if (community.enabled) void community.propose(input)
      }
      setFormError(null)
      return true
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'INVALID_DATA')
      return false
    }
  }

  function handleSaveStature(statureCm: number) {
    try {
      saveStature(statureCm)
      setStatureError(null)
    } catch (error) {
      setStatureError(error instanceof Error ? error.message : 'INVALID_STATURE')
    }
  }

  const allExercises = mergeForDisplay(data.exercises, community.exercises, community.counts)
  const visibleExercises = applyFiltersTo(allExercises, filters, data.profile.statureCm)
  const votedIds = new Set([...data.votedExerciseIds, ...community.votedIds])
  const communityIds = new Set(community.exercises.map((e) => e.id))

  return (
    <I18nProvider language={language}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <SyncMuiColorScheme resolved={resolvedTheme} />
        <AppBar
          position="sticky"
          color="transparent"
          elevation={0}
          sx={{
            // Vetro smerigliato: il contenuto scorre sotto la barra restando leggibile.
            // Col tema a CSS variables il colore va preso dai *Channel: theme.palette.*
            // sarebbe congelato sullo schema chiaro e non seguirebbe data-theme.
            bgcolor: 'rgba(var(--mui-palette-background-defaultChannel) / 0.8)',
            backdropFilter: 'blur(12px)',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Toolbar sx={{ gap: 2 }}>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
              <Logo size={36} />
              <Typography variant="h1">Open Gym</Typography>
            </Stack>
          </Toolbar>
        </AppBar>
        <Container
          component="main"
          maxWidth="md"
          sx={{ py: 3, pb: 16, display: 'flex', flexDirection: 'column', gap: 3 }}
        >
          <UpdateBanner />
          <Box
            component="section"
            aria-label={t('hero.label')}
            sx={{
              p: { xs: 2.5, sm: 3 },
              borderRadius: '24px',
              border: 1,
              borderColor: 'divider',
              // Alone dell'accento dietro al testo: dà profondità senza sporcare la leggibilità
              background:
                'radial-gradient(120% 140% at 0% 0%, rgba(var(--mui-palette-primary-mainChannel) / 0.16) 0%, rgba(var(--mui-palette-primary-mainChannel) / 0) 55%), var(--mui-palette-background-paper)',
            }}
          >
            <Typography variant="overline" color="primary" component="p">
              {t('hero.tagline')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: '46ch' }}>
              {t('hero.description')}
            </Typography>
            <HeroStats
              items={[
                { label: t('hero.proposals'), value: allExercises.length },
                { label: t('hero.votesCast'), value: votedIds.size },
                { label: t('hero.sessions'), value: data.activity.length },
              ]}
            />
            <InstallPanel />
          </Box>
          {corruptedAtStartup && (
            <Alert severity="warning" role="alert" data-cy="corrupted-banner">
              {t('app.corrupted')}
            </Alert>
          )}
          {saveError && (
            <Alert severity="error" role="alert" data-cy="storage-error">
              {translateError(t, saveError)}
            </Alert>
          )}
          {/* La key rimonta il blocco a ogni cambio vista: è ciò che fa ripartire l'animazione */}
          <Box
            key={view}
            className="view-enter"
            sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
          >
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
                  <Typography variant="h2">{t('app.communityExercises')}</Typography>
                  <Button
                    variant="contained"
                    startIcon={formOpen ? <CloseIcon /> : <AddIcon />}
                    data-cy="propose-toggle"
                    aria-expanded={formOpen}
                    onClick={() => (formOpen ? closeForm() : setFormOpen(true))}
                  >
                    {/* Non «Proponi esercizio»: è il nome del submit del form, le query per ruolo collidono */}
                    {formOpen ? t('app.closeForm') : t('app.newProposal')}
                  </Button>
                </Stack>
                <Collapse in={formOpen} unmountOnExit sx={{ mb: 3 }}>
                  <ExerciseForm
                    key={editing?.id ?? 'new'}
                    initial={editing}
                    onSubmit={handleSubmitExercise}
                    onCancel={closeForm}
                    error={formError && translateError(t, formError)}
                  />
                </Collapse>
                {community.message && (
                  <Alert
                    severity="info"
                    role="status"
                    data-cy="community-message"
                    onClose={community.dismissMessage}
                    sx={{ mb: 2 }}
                  >
                    {communityMessageText(t, community.message)}
                  </Alert>
                )}
                <FilterBar
                  filters={filters}
                  onFiltersChange={setFilters}
                  muscleGroups={muscleGroups(allExercises)}
                  statureCm={data.profile.statureCm}
                  onSaveStature={handleSaveStature}
                  statureError={statureError && translateError(t, statureError)}
                  requiresStature={suitabilityRequiresStature(filters, data)}
                />
                <ExerciseList
                  exercises={visibleExercises}
                  totalCount={allExercises.length}
                  votedIds={votedIds}
                  // Il voto di un esercizio della community passa dal worker, quello locale dal dominio
                  onToggleVote={(id) =>
                    communityIds.has(id) ? void community.toggleVote(id) : vote(id)
                  }
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
            {view === 'impostazioni' && (
              <SettingsView
                language={language}
                onLanguageChange={setLanguage}
                theme={theme}
                onThemeChange={setTheme}
                onExport={exportJson}
                onReplace={importJson}
                onMerge={mergeJson}
              />
            )}
          </Box>
          {analytics.available && (
            <PrivacyPanel
              enabled={analytics.enabled}
              doNotTrack={analytics.doNotTrack}
              onChange={analytics.setAnalyticsEnabled}
            />
          )}
        </Container>
        <TabNav view={view} onChange={setView} />
      </ThemeProvider>
    </I18nProvider>
  )
}
