import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import { MUSCLE_GROUPS, type MuscleGroup } from '../domain/types'
import { useT } from '../i18n/context'

interface Props {
  value: MuscleGroup | ''
  onChange: (value: MuscleGroup) => void
  dataCy: string
}

/**
 * Scelta del gruppo muscolare. Era testo libero, ed è così che «Petto», «petto» e «PETTO»
 * sono diventati tre gruppi diversi nei filtri: ora si sceglie da una lista chiusa.
 *
 * Il campo in pagina è di SOLA LETTURA e apre un modale con i gruppi come griglia di pulsanti:
 * col telefono in mano si tocca, non si scrive. Il `data-cy` resta sul campo, dove i test già
 * lo cercano; la scelta si asserisce sul testo mostrato, come per SelectField.
 */
export function MuscleGroupField({ value, onChange, dataCy }: Props) {
  const t = useT()
  const [open, setOpen] = useState(false)

  return (
    <>
      <TextField
        label={t('form.muscleGroup')}
        value={value === '' ? '' : t(`muscle.${value}`)}
        placeholder={t('form.muscleGroupChoose')}
        onClick={() => setOpen(true)}
        // Un campo di sola lettura resta focalizzabile con la tastiera: Invio e Spazio lo aprono
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen(true)
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
        <DialogTitle>{t('form.muscleGroupChoose')}</DialogTitle>
        <DialogContent>
          <Box
            data-cy={`${dataCy}-options`}
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr' },
              gap: 1,
              pt: 1,
            }}
          >
            {MUSCLE_GROUPS.map((group) => (
              <Button
                key={group}
                data-cy={`muscle-option-${group}`}
                variant={value === group ? 'contained' : 'outlined'}
                color={value === group ? 'primary' : 'inherit'}
                onClick={() => {
                  onChange(group)
                  setOpen(false)
                }}
                sx={{ py: 1.25 }}
              >
                {t(`muscle.${group}`)}
              </Button>
            ))}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  )
}
