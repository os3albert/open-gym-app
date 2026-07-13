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
