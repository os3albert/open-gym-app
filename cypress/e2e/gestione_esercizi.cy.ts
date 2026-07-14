// E2E del flusso principale: proporre esercizi, votarli, persistenza tra ricaricamenti.

function proponiEsercizio(nome: string, link: string) {
  cy.apriFormProposta()
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

  it('il volto offuscato è un consiglio, non un obbligo: si propone senza spuntare nulla (M12)', () => {
    cy.apriFormProposta()
    cy.get('[data-cy=face-blur-note]').should('be.visible')
    cy.get('[data-cy=exercise-submit]').should('be.enabled')
  })

  it('rifiuta un link che non è un video YouTube', () => {
    proponiEsercizio('Squat', 'https://vimeo.com/12345')

    cy.get('[data-cy=form-error]').should('contain.text', 'YouTube')
    cy.get('[data-cy=exercise-item]').should('not.exist')
  })

  it("l'upvote incrementa i voti e un secondo click lo rimuove", () => {
    proponiEsercizio('Trazioni', 'https://youtu.be/dQw4w9WgXcQ')

    cy.get('[data-cy=exercise-upvote]').click()
    cy.get('[data-cy=exercise-votes]').should('have.text', '1')
    cy.get('[data-cy=exercise-upvote]').should('have.attr', 'aria-pressed', 'true')

    cy.get('[data-cy=exercise-upvote]').click()
    cy.get('[data-cy=exercise-votes]').should('have.text', '0')
    cy.get('[data-cy=exercise-upvote]').should('have.attr', 'aria-pressed', 'false')
  })

  it('atterra sulla lista della community; la proposta si apre dal FAB in un modale (M12)', () => {
    cy.get('[data-cy=exercise-name]').should('not.exist')
    cy.get('[data-cy=propose-toggle]').should('have.attr', 'aria-expanded', 'false').click()

    // Il form vive in un modale: si chiude dalla sua X, non ri-cliccando il FAB (che ci sta sotto)
    cy.get('[role=dialog]').should('be.visible')
    cy.get('[data-cy=exercise-name]').should('be.visible')
    cy.get('[data-cy=form-close]').click()

    cy.get('[data-cy=exercise-name]').should('not.exist')
    cy.get('[data-cy=propose-toggle]').should('have.attr', 'aria-expanded', 'false')
  })

  it('modifica un esercizio esistente', () => {
    proponiEsercizio('Panca piana', 'https://youtu.be/dQw4w9WgXcQ')

    cy.get('[data-cy=exercise-edit]').click()
    cy.get('[data-cy=exercise-name]').should('have.value', 'Panca piana').clear()
    cy.get('[data-cy=exercise-name]').type('Panca inclinata')
    cy.get('[data-cy=exercise-submit]').click()

    cy.get('[data-cy=exercise-item]').should('contain.text', 'Panca inclinata')
  })

  it('elimina un esercizio solo dopo la conferma', () => {
    proponiEsercizio('Affondi', 'https://youtu.be/dQw4w9WgXcQ')

    cy.get('[data-cy=exercise-delete]').click()
    cy.get('[data-cy=exercise-item]').should('exist')

    cy.get('[data-cy=exercise-delete-confirm]').click()
    cy.get('[data-cy=exercise-item]').should('not.exist')
  })

  it("carica il player incorporato al click sull'anteprima", () => {
    proponiEsercizio('Panca piana', 'https://youtu.be/dQw4w9WgXcQ')

    cy.get('[data-cy=video-iframe]').should('not.exist')
    cy.get('[data-cy=video-facade]').click()
    cy.get('[data-cy=video-iframe]')
      .should('have.attr', 'src')
      .and('include', 'youtube-nocookie.com/embed/dQw4w9WgXcQ')
  })

  it('i dati persistono dopo il ricaricamento della pagina', () => {
    proponiEsercizio('Affondi', 'https://youtu.be/dQw4w9WgXcQ')

    cy.reload()
    cy.get('[data-cy=exercise-item]').should('contain.text', 'Affondi')
  })
})
