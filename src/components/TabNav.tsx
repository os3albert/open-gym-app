import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import type { AppView } from '../hooks/useView'
import { useT } from '../i18n/context'
import type { TextKey } from '../i18n'

const TABS: Array<{ view: AppView; label: TextKey; icon: React.ReactNode }> = [
  { view: 'esercizi', label: 'nav.exercises', icon: <ExploreOutlinedIcon /> },
  { view: 'schede', label: 'nav.plans', icon: <CalendarMonthOutlinedIcon /> },
  { view: 'allenamento', label: 'nav.workout', icon: <FitnessCenterIcon /> },
  { view: 'storico', label: 'nav.history', icon: <ShowChartIcon /> },
  { view: 'impostazioni', label: 'nav.settings', icon: <SettingsOutlinedIcon /> },
]

interface Props {
  view: AppView
  onChange: (view: AppView) => void
}

/** Barra di navigazione MD3 flottante in basso (pillola su vetro): le 4 viste dell'app. */
export function TabNav({ view, onChange }: Props) {
  const t = useT()

  return (
    <Box
      component="nav"
      aria-label={t('nav.label')}
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: (t) => t.zIndex.appBar,
        display: 'flex',
        justifyContent: 'center',
        px: 1.5,
        pt: 1,
        // La barra "galleggia": sotto resta il margine di sicurezza dei telefoni con notch
        pb: 'calc(12px + env(safe-area-inset-bottom))',
        pointerEvents: 'none',
        // Sfumatura verso lo sfondo: il contenuto che scorre sotto la pillola svanisce.
        // Colori dai *Channel: con le CSS variables theme.palette.* resterebbe chiaro.
        background:
          'linear-gradient(to top, rgb(var(--mui-palette-background-defaultChannel)) 55%, rgba(var(--mui-palette-background-defaultChannel) / 0) 100%)',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          pointerEvents: 'auto',
          width: '100%',
          maxWidth: 480,
          borderRadius: 999,
          border: 1,
          borderColor: 'divider',
          bgcolor: 'rgba(var(--mui-palette-background-paperChannel) / 0.85)',
          backdropFilter: 'blur(14px)',
          boxShadow: '0 12px 30px -14px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
        }}
      >
        <BottomNavigation
          showLabels
          value={view}
          onChange={(_event, next: AppView) => onChange(next)}
          sx={{ bgcolor: 'transparent', height: 62 }}
        >
          {TABS.map((tab) => (
            <BottomNavigationAction
              key={tab.view}
              value={tab.view}
              label={t(tab.label)}
              icon={tab.icon}
              data-cy={`tab-${tab.view}`}
              aria-current={view === tab.view ? 'page' : undefined}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  )
}
