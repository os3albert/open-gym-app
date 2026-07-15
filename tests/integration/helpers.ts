import { screen, within } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'

/**
 * Sceglie una voce da un SelectField. I select dell'app sono menu MUI, non più
 * `<select>` nativi (M11): `userEvent.selectOptions` funziona solo sui nativi, quindi
 * qui si apre il menu e si clicca l'opzione per etichetta, com'è nel comportamento reale.
 */
export async function scegliOpzione(user: UserEvent, etichettaCampo: string, opzione: string) {
  await user.click(screen.getByLabelText(etichettaCampo))
  const listbox = await screen.findByRole('listbox')
  await user.click(within(listbox).getByRole('option', { name: opzione }))
}

/**
 * Sceglie un valore dallo spinner di un NumberField (M14): il campo è di sola lettura e apre
 * un modale centrato con la rotella dei valori.
 */
export async function scegliNumero(user: UserEvent, etichettaCampo: string, valore: string) {
  await user.click(screen.getByLabelText(etichettaCampo))
  const dialog = await screen.findByRole('dialog')
  const listbox = within(dialog).getByRole('listbox')
  await user.click(within(listbox).getByRole('option', { name: valore }))
}

/**
 * Scrive un numero fuori scala nello spinner (M14): il modale ha un campo digitabile, perché
 * un 137,5 kg non sta in nessuna rotella ragionevole. Poi conferma.
 */
export async function digitaNumero(user: UserEvent, etichettaCampo: string, valore: string) {
  await user.click(screen.getByLabelText(etichettaCampo))
  const dialog = await screen.findByRole('dialog')
  const campo = within(dialog).getByRole('spinbutton', { name: etichettaCampo })
  await user.clear(campo)
  await user.type(campo, valore)
  await user.click(within(dialog).getByRole('button', { name: 'Conferma' }))
}

/**
 * Sceglie il gruppo muscolare (M14): il campo è di sola lettura e apre un modale con i gruppi.
 * `etichetta` è la parola mostrata all'utente («Petto»), non il codice che finisce nei dati.
 */
export async function scegliGruppo(user: UserEvent, etichetta: string) {
  await user.click(screen.getByLabelText('Gruppo muscolare'))
  const dialog = await screen.findByRole('dialog', { name: 'Scegli il gruppo muscolare' })
  await user.click(within(dialog).getByRole('button', { name: etichetta }))
}
