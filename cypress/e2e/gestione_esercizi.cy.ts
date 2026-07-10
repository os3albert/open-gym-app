// E2E del flusso principale: proporre esercizi, votarli, persistenza tra ricaricamenti.

function proponiEsercizio(nome: string, link: string) {
  cy.get('[data-cy=exercise-name]').type(nome)
  cy.get('[data-cy=exercise-muscle]').type('Petto')
  cy.get('[data-cy=exercise-youtube]').type(link)
  cy.get('[data-cy=exercise-description]').type('Descrizione di prova')
  cy.get('[data-cy=exercise-submit]').click()
}

describe('Gestione esercizi', () => {
  beforeEach(() => {
    cy.visit('/', { onBeforeLoad: (win) => win.localStorage.clear() })
  })

  it('propone un nuovo esercizio con link YouTube valido', () => {
    proponiEsercizio('Panca piana', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')

    cy.get('[data-cy=exercise-item]').should('have.length', 1).and('contain.text', 'Panca piana')
    cy.get('[data-cy=form-error]').should('not.exist')
  })

  it('rifiuta un link che non è un video YouTube', () => {
    proponiEsercizio('Squat', 'https://vimeo.com/12345')

    cy.get('[data-cy=form-error]').should('contain.text', 'YouTube')
    cy.get('[data-cy=exercise-item]').should('not.exist')
  })

  it("l'upvote incrementa il contatore dei voti", () => {
    proponiEsercizio('Trazioni', 'https://youtu.be/dQw4w9WgXcQ')

    cy.get('[data-cy=exercise-upvote]').click()
    cy.get('[data-cy=exercise-votes]').should('have.text', '1')
  })

  it('i dati persistono dopo il ricaricamento della pagina', () => {
    proponiEsercizio('Affondi', 'https://youtu.be/dQw4w9WgXcQ')

    cy.reload()
    cy.get('[data-cy=exercise-item]').should('contain.text', 'Affondi')
  })
})
