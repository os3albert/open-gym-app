import { createTheme, alpha } from '@mui/material/styles'

/**
 * Sotto Vitest le animazioni si azzerano: durante una transizione MUI mette
 * `pointer-events: none` sul contenuto, e userEvent (che clicca davvero) fallisce
 * in modo intermittente, tanto più su macchine lente come i runner della CI.
 */
const underTest = import.meta.env.MODE === 'test'

/**
 * Accento «energia» per i CTA. Il gradiente chiaro NON può schiarirsi oltre #4d7c0f:
 * col testo bianco il verde più acceso (#65a30d) scende a 3.1:1, sotto la soglia AA.
 * Contrasti col testo del bottone: chiaro 5.0:1 → 8.7:1, scuro 11.2:1 → 7.4:1.
 */
export const ACCENT_GRADIENT_LIGHT = 'linear-gradient(135deg, #4d7c0f 0%, #365314 100%)'
export const ACCENT_GRADIENT_DARK = 'linear-gradient(135deg, #bef264 0%, #84cc16 100%)'

/**
 * Tema 3.0 (M11): stesso accento lime del 2.0, ma superfici più «materiche» —
 * gradienti sui CTA, ombre morbide colorate, campi tonali (niente bordo a riposo),
 * card che si sollevano al passaggio del mouse. Gli schemi light/dark restano
 * agganciati all'attributo data-theme su <html>, governato da hooks/useTheme.ts.
 * Contrasti verificati: #4d7c0f su bianco 5.0:1, #a3e635 col testo #1a2e05 9.7:1.
 */
export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'data-theme' },
  ...(underTest ? { transitions: { create: () => 'none' } } : {}),
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#4d7c0f', contrastText: '#ffffff' },
        secondary: { main: '#57534e' },
        background: { default: '#f6f6f4', paper: '#ffffff' },
        text: { primary: '#1c1917', secondary: '#57534e' },
        divider: '#e3e1dd',
        error: { main: '#ba1a1a' },
        success: { main: '#1e6b31' },
        action: { selectedOpacity: 0.12 },
      },
    },
    dark: {
      palette: {
        primary: { main: '#a3e635', contrastText: '#1a2e05' },
        secondary: { main: '#a8a29e' },
        background: { default: '#0f100e', paper: '#191b17' },
        text: { primary: '#e7e5e4', secondary: '#a8a29e' },
        divider: '#2e302b',
        error: { main: '#ffb4ab' },
        success: { main: '#86d993' },
        action: { selectedOpacity: 0.16 },
      },
    },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: "'Inter Variable', 'Inter', system-ui, -apple-system, sans-serif",
    h1: { fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em' },
    h2: { fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.25 },
    h3: { fontSize: '1.0625rem', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.35 },
    h4: { fontSize: '1rem', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.01em' },
    overline: { fontWeight: 700, letterSpacing: '0.14em', fontSize: '0.6875rem' },
  },
  components: {
    // Il Collapse del form di proposta deve essere già "aperto" al primo tick nei test
    MuiCollapse: { defaultProps: { timeout: underTest ? 0 : undefined } },
    // Stessa ragione del Collapse: durante la transizione MUI mette pointer-events: none,
    // e userEvent clicca DAVVERO. Senza questo, i test sul modale falliscono a tradimento.
    MuiDialog: { defaultProps: { transitionDuration: underTest ? 0 : undefined } },
    MuiBackdrop: { defaultProps: { transitionDuration: underTest ? 0 : undefined } },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        // Pillole, target touch ≥ 44px (vincolo M5)
        root: ({ ownerState, theme: t }) => ({
          borderRadius: 999,
          minHeight: 44,
          paddingInline: 20,
          transition: underTest
            ? 'none'
            : 'transform 120ms ease, box-shadow 180ms ease, background-color 180ms ease',
          // Il bottone «cede» sotto il dito e rimbalza: feedback tattile su ogni azione
          '&:hover': { transform: 'translateY(-1px)' },
          '&:active': { transform: 'translateY(0) scale(0.97)' },
          /*
           * Disabilitato: MUI sovrascrive solo il backgroundColor, NON il backgroundImage.
           * Senza azzerare il gradiente, un CTA disabilitato mostra il testo grigio al 26%
           * sopra il lime pieno — illeggibile. Qui si spegne il gradiente e si usa una
           * superficie neutra con testo al 60%: si legge, e resta chiaro che non è attivo.
           */
          '&.Mui-disabled': {
            backgroundImage: 'none',
            boxShadow: 'none',
            transform: 'none',
            backgroundColor:
              ownerState.variant === 'contained'
                ? `rgba(${t.vars.palette.text.primaryChannel} / 0.10)`
                : 'transparent',
            color: `rgba(${t.vars.palette.text.primaryChannel} / 0.6)`,
            ...(ownerState.variant === 'outlined' && {
              borderColor: `rgba(${t.vars.palette.text.primaryChannel} / 0.25)`,
            }),
          },
          // Il CTA principale porta il gradiente del marchio; gli altri colori restano piatti
          ...(ownerState.variant === 'contained' &&
            ownerState.color === 'primary' && {
              backgroundImage: ACCENT_GRADIENT_LIGHT,
              boxShadow: `0 6px 16px -6px ${alpha('#4d7c0f', 0.55)}`,
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: `0 12px 24px -8px ${alpha('#4d7c0f', 0.7)}`,
              },
              ...t.applyStyles('dark', {
                backgroundImage: ACCENT_GRADIENT_DARK,
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: `0 12px 26px -10px ${alpha('#a3e635', 0.55)}`,
                },
              }),
            }),
        }),
        sizeSmall: { minHeight: 38, paddingInline: 14, fontSize: '0.8125rem' },
        // Bordo a mezza tinta del colore del bottone (il divider era troppo tenue per leggersi)
        outlined: ({ theme: t }) => ({
          borderWidth: 1.5,
          '&:hover': { borderWidth: 1.5 },
          // Con color="inherit" (± kg/reps) il bordo sarebbe currentColor a bassa alfa: invisibile
          '&.MuiButton-colorInherit': {
            borderColor: `rgba(${t.vars.palette.text.primaryChannel} / 0.35)`,
            '&:hover': {
              borderColor: `rgba(${t.vars.palette.text.primaryChannel} / 0.6)`,
              backgroundColor: `rgba(${t.vars.palette.text.primaryChannel} / 0.06)`,
            },
          },
        }),
        /*
         * I bottoni testuali delle card (Modifica/Condividi/Elimina/Annulla…) a riposo erano
         * solo testo: su touch, dove l'hover non esiste, non sembravano nemmeno cliccabili.
         * Ora hanno sempre una superficie tonale, che si scurisce al passaggio del mouse.
         */
        text: ({ theme: t }) => ({
          backgroundColor: `rgba(${t.vars.palette.text.primaryChannel} / 0.06)`,
          '&:hover': { backgroundColor: `rgba(${t.vars.palette.text.primaryChannel} / 0.12)` },
        }),
      },
    },
    // Come i bottoni testuali: senza superficie le icone nude non si leggono come comandi
    MuiIconButton: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          color: t.vars.palette.text.primary,
          backgroundColor: `rgba(${t.vars.palette.text.primaryChannel} / 0.06)`,
          '&:hover': { backgroundColor: `rgba(${t.vars.palette.text.primaryChannel} / 0.12)` },
          '&.Mui-disabled': {
            color: `rgba(${t.vars.palette.text.primaryChannel} / 0.35)`,
            backgroundColor: 'transparent',
          },
        }),
      },
    },
    MuiTextField: { defaultProps: { variant: 'outlined', size: 'small' } },
    MuiOutlinedInput: {
      styleOverrides: {
        // Campi tonali: a riposo il bordo sparisce nella superficie, torna sul focus
        root: ({ theme: t }) => ({
          borderRadius: 12,
          backgroundColor: t.vars.palette.background.default,
          transition: 'background-color 120ms ease, box-shadow 120ms ease',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: t.vars.palette.divider },
          // Le tinte derivate passano dai *Channel: alpha(t.palette.…) congelerebbe lo schema chiaro
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: `rgba(${t.vars.palette.text.primaryChannel} / 0.28)`,
          },
          '&.Mui-focused': { backgroundColor: t.vars.palette.background.paper },
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 999, fontWeight: 600, fontSize: '0.75rem' },
        filled: ({ theme: t }) => ({
          backgroundColor: `rgba(${t.vars.palette.text.primaryChannel} / 0.08)`,
          color: t.vars.palette.text.secondary,
        }),
      },
    },
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: ({ theme: t }) => ({
          borderRadius: 20,
          overflow: 'hidden',
          borderColor: t.vars.palette.divider,
          backgroundImage: 'none',
          transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
          '@media (hover: hover)': {
            '&:hover': {
              transform: 'translateY(-2px)',
              borderColor: `rgba(${t.vars.palette.primary.mainChannel} / 0.45)`,
              boxShadow: '0 14px 34px -20px rgba(0, 0, 0, 0.55)',
            },
          },
        }),
      },
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 14, alignItems: 'center' },
      },
    },
    MuiDivider: {
      styleOverrides: { root: ({ theme: t }) => ({ borderColor: t.vars.palette.divider }) },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          minWidth: 60,
          borderRadius: 999,
          margin: 6,
          paddingInline: 4,
          transition: 'color 140ms ease, background-color 140ms ease',
          // L'icona della destinazione attiva si ingrandisce: dice «sei qui» senza testo
          '& .MuiSvgIcon-root': {
            transition: underTest ? 'none' : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
          },
          '&.Mui-selected .MuiSvgIcon-root': { transform: 'scale(1.15)' },
          // Pill tonale sull'accento per la destinazione attiva (stile MD3)
          '&.Mui-selected': {
            backgroundColor: '#e7f6c8',
            color: '#365314',
            ...t.applyStyles('dark', { backgroundColor: '#33401a', color: '#d9f99d' }),
          },
        }),
        label: { '&.Mui-selected': { fontWeight: 700 } },
      },
    },
  },
})
