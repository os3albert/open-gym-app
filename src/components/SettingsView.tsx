import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { ThemePreference } from '../hooks/useTheme'
import { LANGUAGES, type Language } from '../i18n'
import { useT } from '../i18n/context'
import { BackupPanel } from './BackupPanel'
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
}

/**
 * Impostazioni del dispositivo: lingua, tema e backup. Nessuna di queste vive in AppData
 * (lingua e tema hanno chiavi localStorage separate), ed è voluto: sono preferenze di QUESTO
 * dispositivo, non dati da portarsi dietro in un backup.
 */
export function SettingsView({
  language,
  onLanguageChange,
  theme,
  onThemeChange,
  onExport,
  onReplace,
  onMerge,
}: Props) {
  const t = useT()

  return (
    <Stack spacing={3}>
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
    </Stack>
  )
}
