import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import type { AppView } from '../hooks/useView'
import { useT } from '../i18n/context'
import type { TextKey } from '../i18n'

const TABS: Array<{ view: AppView; label: TextKey; icon: React.ReactNode }> = [
  { view: 'home', label: 'nav.home', icon: <HomeOutlinedIcon /> },
  { view: 'community', label: 'nav.community', icon: <ExploreOutlinedIcon /> },
  { view: 'schede', label: 'nav.plans', icon: <CalendarMonthOutlinedIcon /> },
  { view: 'allenamento', label: 'nav.workout', icon: <FitnessCenterIcon /> },
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
        // In landscape il notch mangia i lati: mai sotto la zona sicura (12px il minimo)
        pl: 'max(12px, env(safe-area-inset-left))',
        pr: 'max(12px, env(safe-area-inset-right))',
        pt: 1,
        // Niente safe-area sotto (scelta esplicita): la pillola sta a 12px dal bordo su
        // qualunque telefono, iPhone compreso — l'indicatore home le scorre sotto
        pb: '12px',
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
        {/* Niente showLabels: la scritta sta SOLO sulla voce scelta, le altre restano icona.
            L'aria-label la tiene comunque raggiungibile per nome (i test cercano i tab per
            nome, non per icona), ed è per questo che toglierla dalle non scelte non costa
            nulla: senza, il loro span occupa comunque la larghezza del testo e MUI divide la
            pillola in cinque parti uguali — a 320px ne restano 59 e «Allenamento» (85) usciva
            dal suo tasto, finendo sopra le icone vicine. */}
        <BottomNavigation
          value={view}
          onChange={(_event, next: AppView) => onChange(next)}
          sx={{ bgcolor: 'transparent', height: 62 }}
        >
          {TABS.map((tab) => (
            <BottomNavigationAction
              key={tab.view}
              value={tab.view}
              label={view === tab.view ? t(tab.label) : undefined}
              aria-label={t(tab.label)}
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
