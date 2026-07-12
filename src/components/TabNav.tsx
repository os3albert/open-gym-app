import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import Paper from '@mui/material/Paper'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import type { AppView } from '../hooks/useView'

const TABS: Array<{ view: AppView; label: string; icon: React.ReactNode }> = [
  { view: 'esercizi', label: 'Esercizi', icon: <ExploreOutlinedIcon /> },
  { view: 'schede', label: 'Schede', icon: <CalendarMonthOutlinedIcon /> },
  { view: 'allenamento', label: 'Allenamento', icon: <FitnessCenterIcon /> },
  { view: 'storico', label: 'Storico', icon: <ShowChartIcon /> },
]

interface Props {
  view: AppView
  onChange: (view: AppView) => void
}

/** Barra di navigazione MD3 fissa in basso (stile mockup ui/): le 4 viste dell'app. */
export function TabNav({ view, onChange }: Props) {
  return (
    <Paper
      component="nav"
      elevation={3}
      square
      aria-label="Sezioni dell'app"
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (t) => t.zIndex.appBar,
        pb: 'env(safe-area-inset-bottom)',
      }}
    >
      <BottomNavigation
        showLabels
        value={view}
        onChange={(_event, next: AppView) => onChange(next)}
      >
        {TABS.map((tab) => (
          <BottomNavigationAction
            key={tab.view}
            value={tab.view}
            label={tab.label}
            icon={tab.icon}
            data-cy={`tab-${tab.view}`}
            aria-current={view === tab.view ? 'page' : undefined}
          />
        ))}
      </BottomNavigation>
    </Paper>
  )
}
