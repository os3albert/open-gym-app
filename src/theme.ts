import { createTheme } from '@mui/material/styles'

/**
 * Tema 2.0 (M8): accento lime «energia» su superfici neutre calde, look de-materializzato
 * (campi outlined arrotondati, card morbide, pill tonali). Gli schemi light/dark restano
 * agganciati all'attributo data-theme su <html>, governato da hooks/useTheme.ts.
 * Contrasti verificati: #4d7c0f su bianco 5.0:1, #a3e635 col testo #1a2e05 9.7:1.
 */
export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'data-theme' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#4d7c0f', contrastText: '#ffffff' },
        secondary: { main: '#57534e' },
        background: { default: '#fafaf9', paper: '#ffffff' },
        text: { primary: '#1c1917', secondary: '#57534e' },
        divider: '#d6d3d1',
        error: { main: '#ba1a1a' },
        success: { main: '#1e6b31' },
        action: { selectedOpacity: 0.12 },
      },
    },
    dark: {
      palette: {
        primary: { main: '#a3e635', contrastText: '#1a2e05' },
        secondary: { main: '#a8a29e' },
        background: { default: '#121310', paper: '#1b1c19' },
        text: { primary: '#e7e5e4', secondary: '#a8a29e' },
        divider: '#3f3f3b',
        error: { main: '#ffb4ab' },
        success: { main: '#86d993' },
        action: { selectedOpacity: 0.16 },
      },
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "'Inter Variable', 'Inter', system-ui, -apple-system, sans-serif",
    h1: { fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em' },
    h2: { fontSize: '1.375rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.3 },
    h3: { fontSize: '1.125rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.3 },
    h4: { fontSize: '1rem', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.01em' },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        // Pillole, target touch ≥ 44px (vincolo M5)
        root: { borderRadius: 999, minHeight: 44, paddingInline: 20 },
      },
    },
    MuiTextField: { defaultProps: { variant: 'outlined', size: 'small' } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 12 } } },
    MuiChip: { styleOverrides: { root: { borderRadius: 999, fontWeight: 500 } } },
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: { root: { borderRadius: 20 } },
    },
    MuiAlert: { styleOverrides: { root: { borderRadius: 12 } } },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          minWidth: 64,
          borderRadius: 999,
          margin: 6,
          // Pill tonale sull'accento per la destinazione attiva (stile MD3)
          '&.Mui-selected': {
            backgroundColor: '#ecfccb',
            color: '#365314',
            ...t.applyStyles('dark', { backgroundColor: '#37421a', color: '#d9f99d' }),
          },
        }),
        label: { '&.Mui-selected': { fontWeight: 700 } },
      },
    },
  },
})
