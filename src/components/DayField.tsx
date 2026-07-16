import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import { useT } from '../i18n/context'
import { WEEKDAYS_IT } from '../utils/date'

interface Props {
  value: string
  onChange: (value: string) => void
  dataCy: string
}

/**
 * I giorni che si scelgono col dito. I sette della settimana fanno scattare l'allenamento del
 * giorno da soli (`TodayWorkout` li riconosce per nome); i «Giorno A/B/C» sono per chi non si
 * lega al calendario e se li sceglie a mano.
 */
const DAY_OPTIONS: readonly string[] = [...WEEKDAYS_IT, 'Giorno A', 'Giorno B', 'Giorno C']

/**
 * Scelta del giorno di una scheda (M15).
 *
 * Era un campo libero con un `datalist`: i suggerimenti si vedevano solo dopo aver cominciato a
 * digitare, cioè quando non servivano più — e un «lunedi» senza accento diventava un giorno
 * diverso da «Lunedì», che l'allenamento del giorno poi non riconosceva.
 *
 * Stesso gesto di NumberField e MuscleGroupField: il campo in pagina è di SOLA LETTURA e apre un
 * modale con i giorni da toccare. Dentro resta un campo scrivibile — come i carichi fuori scala
 * dello spinner — perché «Petto e bicipiti» è un nome di giorno legittimo che nessuna lista può
 * prevedere.
 *
 * I nomi restano in italiano anche in inglese: sono DATI (finiscono nella scheda e nei backup) e
 * `weekdayNameIt` li confronta così. Tradurli qui vorrebbe dire cambiare lo schema.
 *
 * Contratto dei test: il `data-cy` resta sul campo, ma non ci si digita dentro — si usano
 * `scegliGiorno`/`digitaGiorno` e `cy.scegliGiorno`/`cy.digitaGiorno`.
 */
export function DayField({ value, onChange, dataCy }: Props) {
  const t = useT()
  const [open, setOpen] = useState(false)
  // Si lavora su una bozza: «Annulla» deve poter lasciare il valore com'era
  const [draft, setDraft] = useState(value)

  // La bozza si allinea al valore corrente QUANDO si apre, nel gestore del click: farlo in un
  // effetto sarebbe un setState sincrono dentro l'effetto, che React sconsiglia.
  function apri() {
    setDraft(value)
    setOpen(true)
  }

  function conferma() {
    onChange(draft)
    setOpen(false)
  }

  return (
    <>
      <TextField
        label={t('planEditor.newDay')}
        placeholder={t('planEditor.newDayExample')}
        value={value}
        onClick={apri}
        // Un campo di sola lettura resta focalizzabile con la tastiera: Invio e Spazio lo aprono
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            apri()
          }
        }}
        slotProps={{
          htmlInput: {
            'data-cy': dataCy,
            readOnly: true,
            'aria-haspopup': 'dialog',
            'aria-expanded': open,
            style: { cursor: 'pointer' },
          },
        }}
      />
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{t('planEditor.chooseDay')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label={t('planEditor.customDay')}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                conferma()
              }
            }}
            slotProps={{
              htmlInput: {
                'data-cy': `${dataCy}-input`,
                // L'aria-label va sull'input VERO: sul TextField finirebbe sul contenitore
                'aria-label': t('planEditor.customDay'),
              },
            }}
            sx={{ mt: 1 }}
          />
          <Box
            data-cy={`${dataCy}-options`}
            sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 2 }}
          >
            {DAY_OPTIONS.map((day) => (
              <Button
                key={day}
                data-cy="day-option"
                variant={value === day ? 'contained' : 'outlined'}
                color={value === day ? 'primary' : 'inherit'}
                onClick={() => {
                  onChange(day)
                  setOpen(false)
                }}
                sx={{ py: 1.25 }}
              >
                {day}
              </Button>
            ))}
          </Box>
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
