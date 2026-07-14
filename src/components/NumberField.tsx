import { useEffect, useRef, useState } from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import MenuList from '@mui/material/MenuList'
import TextField from '@mui/material/TextField'
import type { SxProps, Theme } from '@mui/material/styles'
import { useT } from '../i18n/context'

interface Props {
  label: string
  value: string
  onChange: (value: string) => void
  dataCy: string
  /** I valori plausibili, quelli che lo spinner propone. Digitare resta possibile, nel modale. */
  options: number[]
  placeholder?: string
  sx?: SxProps<Theme>
}

/**
 * Unico input numerico dell'app (come SelectField è l'unico select e MuscleGroupField l'unico
 * gruppo muscolare).
 *
 * Il campo in pagina è di SOLA LETTURA: toccarlo apre uno spinner in un modale al centro dello
 * schermo, dove si scorre la rotella dei valori — in palestra si tocca, non si digita. Dentro il
 * modale c'è comunque un campo scrivibile, perché un 137,5 kg fuori scala deve poter entrare.
 *
 * Niente più pulsanti +/− a fianco: erano un terzo modo di fare la stessa cosa.
 *
 * Contratto dei test: il `data-cy` resta sul campo in pagina, ma NON ci si digita più dentro —
 * si usano gli helper `scegliNumero(user, label, valore)` e `cy.scegliNumero(dataCy, valore)`.
 */
export function NumberField({ label, value, onChange, dataCy, options, placeholder, sx }: Props) {
  const t = useT()
  const [open, setOpen] = useState(false)
  // Si lavora su una bozza: «Annulla» deve poter lasciare il valore com'era
  const [draft, setDraft] = useState(value)
  const selectedRef = useRef<HTMLLIElement>(null)

  useEffect(() => {
    if (!open) return
    setDraft(value)
    // La lista si posiziona sul valore corrente: 121 carichi non si scorrono a mano
    const timer = window.setTimeout(
      () => selectedRef.current?.scrollIntoView({ block: 'center' }),
      0,
    )
    return () => window.clearTimeout(timer)
  }, [open, value])

  function conferma() {
    onChange(draft)
    setOpen(false)
  }

  return (
    <>
      <TextField
        label={label}
        value={value}
        placeholder={placeholder}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen(true)
          }
        }}
        sx={sx}
        slotProps={{
          htmlInput: {
            'data-cy': dataCy,
            readOnly: true,
            inputMode: 'decimal',
            'aria-haspopup': 'dialog',
            'aria-expanded': open,
            style: { cursor: 'pointer' },
          },
        }}
      />
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ textAlign: 'center' }}>{label}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <TextField
            autoFocus
            type="number"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            slotProps={{
              htmlInput: {
                'data-cy': `${dataCy}-input`,
                inputMode: 'decimal',
                // L'aria-label va sull'input VERO: sul TextField finirebbe sul contenitore
                'aria-label': label,
                style: { textAlign: 'center', fontSize: '2rem', fontWeight: 700 },
              },
            }}
            sx={{
              width: 180,
              // Via le frecciette native: lo spinner è la rotella qui sotto
              '& input[type=number]': { MozAppearance: 'textfield' },
              '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
                { WebkitAppearance: 'none', margin: 0 },
            }}
          />
          <MenuList
            role="listbox"
            dense
            data-cy={`${dataCy}-options`}
            sx={{ mt: 1, width: 180, maxHeight: 240, overflowY: 'auto' }}
          >
            {options.map((option) => {
              const selected = String(option) === draft
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
        </DialogContent>
        <DialogActions>
          <Button color="inherit" data-cy={`${dataCy}-cancel`} onClick={() => setOpen(false)}>
            {t('list.cancel')}
          </Button>
          <Button variant="contained" data-cy={`${dataCy}-confirm`} onClick={conferma}>
            {t('number.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
