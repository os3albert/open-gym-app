// Comandi custom condivisi tra le spec E2E.

const STORAGE_KEY = 'open-gym-app/data'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- richiesto dal type-merging di Cypress
  namespace Cypress {
    interface Chainable {
      /** Visita l'app con un contenuto di localStorage predisposto prima del caricamento. */
      visitWithData(data: unknown): Chainable<Cypress.AUTWindow>
      /** Apre il form di proposta (collassato all'atterraggio); no-op se è già aperto. */
      apriFormProposta(): Chainable<void>
      /** Va alla vista Impostazioni: da M12 tema e backup vivono lì, non più sotto ogni vista. */
      apriImpostazioni(): Chainable<void>
      /**
       * Sceglie una voce da un SelectField (menu MUI, non più un <select> nativo:
       * cy.select() qui non funziona). Apre il menu e clicca l'opzione per etichetta.
       */
      scegliOpzione(dataCy: string, etichetta: string): Chainable<void>
      /** Sceglie un valore dalla rotella di un NumberField (si apre dal bottone del campo). */
      scegliNumero(dataCy: string, valore: string): Chainable<void>
      /** Scrive un numero fuori scala nello spinner e conferma. */
      digitaNumero(dataCy: string, valore: string): Chainable<void>
      /** Sceglie il gruppo muscolare dal modale (M14): il campo non si digita più. */
      scegliGruppo(codice: string): Chainable<void>
      /** Sceglie un giorno dalla lista del modale (M15): il campo non si digita più. */
      scegliGiorno(giorno: string): Chainable<void>
      /** Scrive nel modale un nome di giorno che non è in lista, e conferma. */
      digitaGiorno(giorno: string): Chainable<void>
    }
  }
}

Cypress.Commands.add('scegliOpzione', (dataCy: string, etichetta: string) => {
  cy.get(`[data-cy=${dataCy}]`).click()
  // Il menu è in un portale fuori dal campo: si cerca nel listbox, non nel DOM del select
  cy.get('[role=listbox]').contains('[role=option]', etichetta).click()
  // Il menu si chiude in dissolvenza: senza attendere, il click successivo può finire sul backdrop
  cy.get('[role=listbox]').should('not.exist')
})

Cypress.Commands.add('scegliNumero', (dataCy: string, valore: string) => {
  // Da M14 il campo è di sola lettura: apre uno spinner in un modale al centro dello schermo
  cy.get(`[data-cy=${dataCy}]`).click()
  cy.get(`[data-cy=${dataCy}-options] [role=option]`)
    .filter((_, el) => el.textContent === valore)
    .first()
    .click()
  cy.get(`[data-cy=${dataCy}-options]`).should('not.exist')
})

Cypress.Commands.add('digitaNumero', (dataCy: string, valore: string) => {
  cy.get(`[data-cy=${dataCy}]`).click()
  cy.get(`[data-cy=${dataCy}-input]`).clear()
  cy.get(`[data-cy=${dataCy}-input]`).type(valore)
  cy.get(`[data-cy=${dataCy}-confirm]`).click()
  cy.get(`[data-cy=${dataCy}-options]`).should('not.exist')
})

Cypress.Commands.add('scegliGruppo', (codice: string) => {
  cy.get('[data-cy=exercise-muscle]').click()
  cy.get(`[data-cy=muscle-option-${codice}]`).click()
  cy.get('[data-cy=exercise-muscle-options]').should('not.exist')
})

Cypress.Commands.add('scegliGiorno', (giorno: string) => {
  cy.get('[data-cy=day-name-input]').click()
  // Per testo: i giorni sono nomi italiani con gli accenti, non codici come i gruppi muscolari
  cy.get('[data-cy=day-name-input-options]').contains('button', giorno).click()
  cy.get('[data-cy=day-name-input-options]').should('not.exist')
})

Cypress.Commands.add('digitaGiorno', (giorno: string) => {
  cy.get('[data-cy=day-name-input]').click()
  cy.get('[data-cy=day-name-input-input]').clear()
  cy.get('[data-cy=day-name-input-input]').type(giorno)
  cy.get('[data-cy=day-name-input-confirm]').click()
  cy.get('[data-cy=day-name-input-options]').should('not.exist')
})

Cypress.Commands.add('apriImpostazioni', () => {
  cy.get('[data-cy=tab-impostazioni]').click()
})

Cypress.Commands.add('apriFormProposta', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-cy=exercise-name]').length === 0) {
      cy.get('[data-cy=propose-toggle]').click()
    }
  })
  // Il form deve essere davvero in pagina prima di scriverci: il Dialog ha una transizione,
  // e durante l'uscita i suoi campi sono ancora nel DOM (per un istante sembra già aperto).
  cy.get('[data-cy=exercise-name]').should('be.visible')
})

Cypress.Commands.add('visitWithData', (data: unknown) => {
  // Niente onBeforeLoad: la test isolation di Cypress ripulisce localStorage a cavallo
  // della prima visita e cancellerebbe il seed. Si semina a pagina carica e si ricarica.
  cy.visit('/')
  cy.window().then((win) => {
    win.localStorage.clear()
    win.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  })
  return cy.reload()
})

export {}
