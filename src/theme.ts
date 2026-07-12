import { createTheme } from '@mui/material/styles'

/**
 * Tema Material Design 3 monocromo, derivato dai mockup in ui/.
 * Gli schemi light/dark sono agganciati all'attributo data-theme su <html>,
 * che resta governato da hooks/useTheme.ts: MUI cambia palette via selettore CSS,
 * senza una seconda fonte di verità.
 */
export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'data-theme' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#1a1c1c', contrastText: '#ffffff' },
        secondary: { main: '#5f5e5e' },
        background: { default: '#f9f9f9', paper: '#ffffff' },
        text: { primary: '#1a1c1c', secondary: '#444748' },
        divider: '#c4c7c7',
        error: { main: '#ba1a1a' },
        success: { main: '#1e6b31' },
        action: { selectedOpacity: 0.12 },
      },
    },
    dark: {
      palette: {
        primary: { main: '#e2e2e2', contrastText: '#1a1c1c' },
        secondary: { main: '#c8c6c6' },
        background: { default: '#111414', paper: '#1a1c1c' },
        text: { primary: '#e2e2e2', secondary: '#c4c7c7' },
        divider: '#444748',
        error: { main: '#ffb4ab' },
        success: { main: '#86d993' },
        action: { selectedOpacity: 0.16 },
      },
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "'Inter Variable', 'Inter', system-ui, -apple-system, sans-serif",
    h1: { fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontSize: '1.375rem', fontWeight: 600, lineHeight: 1.3 },
    h3: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.3 },
    h4: { fontSize: '1rem', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 500, letterSpacing: '0.01em' },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        // Pillole MD3, target touch ≥ 44px (vincolo M5)
        root: { borderRadius: 999, minHeight: 44, paddingInline: 20 },
      },
    },
    MuiTextField: { defaultProps: { variant: 'filled', size: 'small' } },
    MuiChip: { styleOverrides: { root: { borderRadius: 8, fontWeight: 500 } } },
    MuiCard: { defaultProps: { variant: 'outlined' } },
    MuiAlert: { styleOverrides: { root: { borderRadius: 12 } } },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: { minWidth: 64 },
        label: { '&.Mui-selected': { fontWeight: 600 } },
      },
    },
  },
})
