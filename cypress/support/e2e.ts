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
    }
  }
}

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
