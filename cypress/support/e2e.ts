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

Cypress.Commands.add('apriImpostazioni', () => {
  cy.get('[data-cy=tab-impostazioni]').click()
})

Cypress.Commands.add('apriFormProposta', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-cy=exercise-name]').length === 0) {
      cy.get('[data-cy=propose-toggle]').click()
    }
  })
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
