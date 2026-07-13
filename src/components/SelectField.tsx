import MenuItem from '@mui/material/MenuItem'
import type { SelectProps } from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import type { SxProps, Theme } from '@mui/material/styles'

export interface SelectOption {
  value: string
  label: string
}

interface Props {
  label: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  /** Finisce sull'elemento che apre il menu: è quello che cliccano le spec Cypress. */
  dataCy: string
  sx?: SxProps<Theme>
}

/**
 * Unico select dell'app (M11). È un MUI Select NON nativo: il menu è disegnato dall'app
 * (superficie della card, raggi, voce attiva tonale) e non dal sistema operativo, che
 * col resto del design stonava. Prima erano `<select>` nativi: il cambio ha un costo,
 * `userEvent.selectOptions` e `cy.select()` NON funzionano più — si passa dagli helper
 * `scegliOpzione` (test di integrazione) e `cy.scegliOpzione` (Cypress), che aprono il
 * menu e cliccano la voce per etichetta.
 */
export function SelectField({ label, value, onChange, options, dataCy, sx }: Props) {
  return (
    <TextField
      select
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={sx}
      slotProps={{
        inputLabel: { shrink: true },
        // SelectProps non tipizza i data-* (come lo slot input di Checkbox): serve il cast
        select: {
          // displayEmpty: senza, la voce con value '' («Scegli un esercizio…») resterebbe muta
          displayEmpty: true,
          /*
           * Il data-cy va sul div che MOSTRA il valore (role=combobox), non sul root del
           * Select: il root ingloba anche la legenda della label, e il suo testo sarebbe
           * «AutoTema» invece di «Auto», rompendo gli assert sul valore scelto.
           */
          SelectDisplayProps: { 'data-cy': dataCy } as React.HTMLAttributes<HTMLDivElement>,
          MenuProps: {
            slotProps: {
              paper: {
                sx: {
                  mt: 0.5,
                  borderRadius: '14px',
                  border: 1,
                  borderColor: 'divider',
                  backgroundImage: 'none',
                  boxShadow: '0 16px 40px -20px rgba(0, 0, 0, 0.5)',
                },
              },
            },
          },
        } as SelectProps,
      }}
    >
      {options.map((option) => (
        <MenuItem
          key={option.value}
          value={option.value}
          sx={{
            borderRadius: '10px',
            mx: 0.5,
            my: 0.25,
            '&.Mui-selected': {
              backgroundColor: 'rgba(var(--mui-palette-primary-mainChannel) / 0.16)',
              '&:hover': { backgroundColor: 'rgba(var(--mui-palette-primary-mainChannel) / 0.24)' },
            },
          }}
        >
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  )
}
