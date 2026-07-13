import { useEffect, useRef, useState } from 'react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Button from '@mui/material/Button'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import MenuList from '@mui/material/MenuList'
import Paper from '@mui/material/Paper'
import Popper from '@mui/material/Popper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import type { SxProps, Theme } from '@mui/material/styles'
import { useT } from '../i18n/context'

/** I due bottoni di incremento a fianco del campo: in palestra si tocca, non si digita. */
export interface NumberStepper {
  step: number
  min: number
  decreaseCy: string
  increaseCy: string
  decreaseLabel: string
  increaseLabel: string
}

interface Props {
  label: string
  value: string
  onChange: (value: string) => void
  dataCy: string
  /** I valori plausibili, quelli che la rotella propone. Digitare resta sempre possibile. */
  options: number[]
  stepper?: NumberStepper
  placeholder?: string
  sx?: SxProps<Theme>
}

/** Elenco di valori da min a max: `range(0, 300, 2.5)` = i carichi di un bilanciere. */
export function range(min: number, max: number, step = 1): number[] {
  const values: number[] = []
  // Si conta in passi interi e si arrotonda: 0.1+0.2 in virgola mobile non fa 0.3
  for (let i = 0; min + i * step <= max + 1e-9; i++) {
    values.push(Number((min + i * step).toFixed(2)))
  }
  return values
}

/** Somma `delta` al valore corrente senza scendere sotto `min`; il vuoto vale 0. */
function applyStep(current: string, delta: number, min: number): string {
  const next = Number(((Number(current) || 0) + delta).toFixed(2))
  return String(Math.max(min, next))
}

/**
 * Unico input numerico dell'app (come SelectField è l'unico select).
 *
 * Il campo resta un vero input digitabile — serve per i valori fuori scala — e accanto ha una
 * ROTELLA di valori pronti, che si apre dal bottone del campo. Perché da un bottone e non da un
 * click qualsiasi sul campo: aprendola a ogni click coprirebbe ciò che sta sotto (compreso
 * «Aggiungi serie»), e l'utente che vuole solo digitare se la troverebbe sempre tra i piedi.
 *
 * È un Popper e non un Popover: niente backdrop né trappola del focus, così si continua a
 * digitare mentre la rotella è aperta.
 */
export function NumberField({
  label,
  value,
  onChange,
  dataCy,
  options,
  stepper,
  placeholder,
  sx,
}: Props) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const anchor = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLLIElement>(null)

  // All'apertura la lista si posiziona sul valore corrente: 121 carichi non si scorrono a mano
  useEffect(() => {
    if (open) selectedRef.current?.scrollIntoView({ block: 'center' })
  }, [open])

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          ref={anchor}
          label={label}
          type="number"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
          sx={sx}
          slotProps={{
            htmlInput: { 'data-cy': dataCy, inputMode: 'decimal' },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    edge="end"
                    data-cy={`${dataCy}-wheel`}
                    aria-label={t('number.chooseValue', { label })}
                    aria-expanded={open}
                    onClick={() => setOpen((wasOpen) => !wasOpen)}
                  >
                    <ExpandMoreIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
        {stepper && (
          <>
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              data-cy={stepper.decreaseCy}
              aria-label={stepper.decreaseLabel}
              onClick={() => onChange(applyStep(value, -stepper.step, stepper.min))}
              sx={{ minWidth: 0 }}
            >
              {`−${String(stepper.step).replace('.', ',')}`}
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              data-cy={stepper.increaseCy}
              aria-label={stepper.increaseLabel}
              onClick={() => onChange(applyStep(value, stepper.step, stepper.min))}
              sx={{ minWidth: 0 }}
            >
              {`+${String(stepper.step).replace('.', ',')}`}
            </Button>
          </>
        )}
        <Popper
          open={open}
          anchorEl={anchor.current}
          placement="bottom-start"
          sx={{ zIndex: (theme) => theme.zIndex.modal }}
        >
          <Paper
            elevation={8}
            sx={{ mt: 0.5, maxHeight: 240, overflowY: 'auto', borderRadius: '14px' }}
          >
            <MenuList role="listbox" dense data-cy={`${dataCy}-options`}>
              {options.map((option) => {
                const selected = String(option) === value
                return (
                  <MenuItem
                    key={option}
                    role="option"
                    aria-selected={selected}
                    selected={selected}
                    ref={selected ? selectedRef : undefined}
                    onClick={() => {
                      onChange(String(option))
                      setOpen(false)
                    }}
                    sx={{ justifyContent: 'center', fontVariantNumeric: 'tabular-nums' }}
                  >
                    {option}
                  </MenuItem>
                )
              })}
            </MenuList>
          </Paper>
        </Popper>
      </Stack>
    </ClickAwayListener>
  )
}
