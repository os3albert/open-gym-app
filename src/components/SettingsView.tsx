import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { ThemePreference } from '../hooks/useTheme'
import { LANGUAGES, type Language } from '../i18n'
import { useT } from '../i18n/context'
import { BackupPanel } from './BackupPanel'
import { InstallPanel } from './InstallPanel'
import { PrivacyPanel } from './PrivacyPanel'
import { SelectField } from './SelectField'

/** Nomi delle lingue nella lingua stessa: chi cerca l'inglese cerca «English», non «Inglese». */
const LANGUAGE_NAMES: Record<Language, string> = {
  it: 'Italiano',
  en: 'English',
}

interface Props {
  language: Language
  onLanguageChange: (language: Language) => void
  theme: ThemePreference
  onThemeChange: (theme: ThemePreference) => void
  onExport: () => string
  onReplace: (json: string) => void
  onMerge: (json: string) => void
  /** I tre numeri dell'hero: da M18 la presentazione vive qui, non sopra ogni vista. */
  stats: { proposals: number; votesCast: number; sessions: number }
  /** Statistiche d'uso (Umami): il pannello appare solo se l'istanza le ha configurate. */
  analytics: {
    available: boolean
    enabled: boolean
    doNotTrack: boolean
    onChange: (enabled: boolean) => void
  }
}

/** Riquadro di sintesi: tre numeri sullo stato dei dati locali. */
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

/**
 * Impostazioni del dispositivo: lingua, tema e backup. Nessuna di queste vive in AppData
 * (lingua e tema hanno chiavi localStorage separate), ed è voluto: sono preferenze di QUESTO
 * dispositivo, non dati da portarsi dietro in un backup.
 *
 * Da M18 ospita anche la presentazione dell'app (hero + installazione) e le statistiche
 * d'uso: sono cose che si leggono una volta, non che devono stare sopra OGNI vista.
 */
export function SettingsView({
  language,
  onLanguageChange,
  theme,
  onThemeChange,
  onExport,
  onReplace,
  onMerge,
  stats,
  analytics,
}: Props) {
  const t = useT()

  return (
    <Stack spacing={3}>
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
            { label: t('hero.proposals'), value: stats.proposals },
            { label: t('hero.votesCast'), value: stats.votesCast },
            { label: t('hero.sessions'), value: stats.sessions },
          ]}
        />
        <InstallPanel />
      </Box>
      <Card component="section" data-cy="settings-panel">
        <CardContent>
          <Typography variant="h2" gutterBottom>
            {t('nav.settings')}
          </Typography>
          <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap', mt: 2 }}>
            <SelectField
              label={t('settings.language')}
              value={language}
              onChange={(value) => onLanguageChange(value as Language)}
              dataCy="language-select"
              sx={{ minWidth: 160 }}
              options={LANGUAGES.map((code) => ({ value: code, label: LANGUAGE_NAMES[code] }))}
            />
            <SelectField
              label={t('settings.theme')}
              value={theme}
              onChange={(value) => onThemeChange(value as ThemePreference)}
              dataCy="theme-select"
              sx={{ minWidth: 160 }}
              options={[
                { value: 'auto', label: t('settings.themeAuto') },
                { value: 'chiaro', label: t('settings.themeLight') },
                { value: 'scuro', label: t('settings.themeDark') },
              ]}
            />
          </Stack>
        </CardContent>
      </Card>
      <BackupPanel onExport={onExport} onReplace={onReplace} onMerge={onMerge} />
      {analytics.available && (
        <PrivacyPanel
          enabled={analytics.enabled}
          doNotTrack={analytics.doNotTrack}
          onChange={analytics.onChange}
        />
      )}
    </Stack>
  )
}
