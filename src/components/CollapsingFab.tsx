import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Fab from '@mui/material/Fab'

interface Props {
  icon: ReactNode
  label: string
  /** Da ritirato resta la sola icona: un cerchio, come un Fab non esteso. */
  collapsed: boolean
  onClick: () => void
  dataCy: string
  ariaLabel?: string
  ariaExpanded?: boolean
}

/**
 * Il Fab esteso che si ritira a cerchio con una transizione (M14).
 *
 * Sempre «extended»: a cambiare è la LARGHEZZA, che si anima. Alternando i due variant
 * MUI ricalcola il box di colpo, e il pulsante saltava. La scritta non si smonta: sfuma
 * E collassa la propria larghezza — la sola opacità la lasciava nel flusso, e il contenuto
 * centrato traboccava dal ritaglio portandosi via l'icona (restava un cerchio vuoto).
 */
export function CollapsingFab({
  icon,
  label,
  collapsed,
  onClick,
  dataCy,
  ariaLabel,
  ariaExpanded,
}: Props) {
  return (
    <Fab
      color="primary"
      variant="extended"
      data-cy={dataCy}
      aria-expanded={ariaExpanded}
      // Il nome accessibile NON dipende dalla scritta: quando il Fab si ritira, i test (e gli
      // screen reader) devono continuare a trovarlo per nome.
      aria-label={ariaLabel ?? label}
      onClick={onClick}
      sx={{
        overflow: 'hidden',
        // Ritirandosi resta un cerchio: la larghezza scende a quella dell'altezza
        minWidth: 0,
        width: collapsed ? 56 : 'auto',
        px: collapsed ? 0 : 2,
        transition: (t) =>
          t.transitions.create(['width', 'padding'], {
            duration: t.transitions.duration.shorter,
            easing: t.transitions.easing.easeInOut,
          }),
      }}
    >
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          mr: collapsed ? 0 : 1,
          flexShrink: 0,
          transition: (t) =>
            t.transitions.create('margin', {
              duration: t.transitions.duration.shorter,
              easing: t.transitions.easing.easeInOut,
            }),
        }}
      >
        {icon}
      </Box>
      <Box
        component="span"
        sx={{
          whiteSpace: 'nowrap',
          display: 'inline-block',
          overflow: 'hidden',
          maxWidth: collapsed ? 0 : 200,
          opacity: collapsed ? 0 : 1,
          transition: (t) =>
            t.transitions.create(['max-width', 'opacity'], {
              duration: t.transitions.duration.shorter,
              easing: t.transitions.easing.easeInOut,
            }),
        }}
      >
        {label}
      </Box>
    </Fab>
  )
}
