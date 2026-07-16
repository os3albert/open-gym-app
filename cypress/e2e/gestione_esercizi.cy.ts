// E2E del flusso principale: proporre esercizi, votarli, persistenza tra ricaricamenti.

function proponiEsercizio(nome: string, link: string, difficolta = 'Media') {
  cy.apriFormProposta()
  cy.get('[data-cy=exercise-name]').type(nome)
  cy.scegliGruppo('chest')
  cy.get('[data-cy=exercise-youtube]').type(link)
  cy.get('[data-cy=exercise-description]').type('Descrizione di prova')
  // Obbligatoria da M13: senza, il dominio rifiuta la proposta
  cy.scegliOpzione('exercise-difficulty', difficolta)
  cy.get('[data-cy=exercise-submit]').click()
}

describe('Gestione esercizi', () => {
  beforeEach(() => {
    // La spec esercita la lista della community: ci si atterra dalla query string,
    // che è il meccanismo dell'app (da M16 l'atterraggio nudo è la Home)
    cy.visit('/?vista=community', { onBeforeLoad: (win) => win.localStorage.clear() })
  })

  it('propone un nuovo esercizio con link YouTube valido', () => {
    proponiEsercizio('Panca piana', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')

    cy.get('[data-cy=exercise-item]').should('have.length', 1).and('contain.text', 'Panca piana')
    cy.get('[data-cy=form-error]').should('not.exist')
  })

  it('il volto offuscato è un consiglio, non un obbligo: si propone senza spuntare nulla (M12)', () => {
    cy.apriFormProposta()
    // Il modale è più alto di prima (c'è anche la difficoltà): la dicitura sta sotto la piega,
    // e «visibile» per Cypress vuol dire dentro al viewport. La si porta in vista.
    cy.get('[data-cy=face-blur-note]').scrollIntoView().should('be.visible')
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

  it('la difficoltà è obbligatoria, compare sulla card e filtra la lista (M13)', () => {
    // Senza sceglierla, il dominio rifiuta la proposta
    cy.apriFormProposta()
    cy.get('[data-cy=exercise-name]').type('Stacco da terra')
    cy.get('[data-cy=exercise-youtube]').type('https://youtu.be/dQw4w9WgXcQ')
    cy.get('[data-cy=exercise-submit]').click()
    cy.get('[data-cy=form-error]').should('contain.text', 'Scegli il grado di difficoltà')

    // Anche il gruppo muscolare è obbligatorio (M14), e si sceglie da un modale
    cy.scegliOpzione('exercise-difficulty', 'Difficile')
    cy.get('[data-cy=exercise-submit]').click()
    cy.get('[data-cy=form-error]').should('contain.text', 'Scegli il gruppo muscolare')

    cy.scegliGruppo('back')
    cy.get('[data-cy=exercise-submit]').click()
    // Il modale esce in dissolvenza: finché non è sparito, i suoi campi sono ancora nel DOM
    cy.get('[role=dialog]').should('not.exist')
    cy.get('[data-cy=difficulty-badge]').should('contain.text', 'Difficile')

    // Un secondo esercizio, facile: il filtro deve separarli
    proponiEsercizio('Camminata', 'https://youtu.be/BBBBBBBBBBB', 'Facile')
    cy.get('[data-cy=exercise-item]').should('have.length', 2)

    cy.scegliOpzione('filter-difficulty', 'Facile')
    cy.get('[data-cy=exercise-item]').should('have.length', 1).and('contain.text', 'Camminata')
  })

  it('modifica un esercizio esistente', () => {
    proponiEsercizio('Panca piana', 'https://youtu.be/dQw4w9WgXcQ')

    cy.get('[data-cy=exercise-edit]').click()
    cy.get('[data-cy=exercise-name]').should('have.value', 'Panca piana').clear()
    cy.get('[data-cy=exercise-name]').type('Panca inclinata')
    cy.scegliOpzione('exercise-difficulty', 'Media')
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

  it('ritirandosi allo scorrimento, il FAB mostra ancora il «+» (M14)', () => {
    // Servono abbastanza card da far scorrere la pagina, altrimenti il FAB non si ritira mai
    cy.visitWithData({
      schemaVersion: 3,
      exercises: Array.from({ length: 8 }, (_, i) => ({
        id: `ex-${i}`,
        name: `Esercizio ${i + 1}`,
        description: '',
        youtubeUrl: `https://youtu.be/AAAAAAAAAA${i}`,
        muscleGroup: 'chest',
        faceBlurConfirmed: true,
        votes: 0,
        createdAt: '2026-07-01T10:00:00.000Z',
      })),
      plans: [],
      activePlanId: null,
      activity: [],
      profile: { statureCm: null },
      votedExerciseIds: [],
    })

    cy.get('[data-cy=tab-community]').click()
    cy.scrollTo(0, 600)
    // Ritirato: il cerchio è largo quanto è alto…
    cy.get('[data-cy=propose-toggle]').invoke('outerWidth').should('be.closeTo', 56, 2)
    // …e il «+» deve stare DENTRO il cerchio: la scritta che sfumava senza cedere larghezza
    // spingeva l'icona fuori dal ritaglio, lasciando un pulsante vuoto.
    cy.get('[data-cy=propose-toggle]').then(($fab) => {
      const fab = $fab[0].getBoundingClientRect()
      const icon = $fab.find('svg')[0].getBoundingClientRect()
      expect(icon.left).to.be.at.least(fab.left)
      expect(icon.right).to.be.at.most(fab.right)
    })
  })

  it('con tanti esercizi la lista va a pagine, e la ricerca la restringe (M16)', () => {
    cy.visitWithData({
      schemaVersion: 6,
      exercises: Array.from({ length: 30 }, (_, i) => ({
        id: `ex-${i}`,
        name: i === 0 ? 'Panca piana' : `Esercizio ${i + 1}`,
        description: '',
        youtubeUrl: `https://youtu.be/AAAAAAAAA${String(i).padStart(2, '0')}`,
        muscleGroup: 'chest',
        difficulty: 'medium',
        faceBlurConfirmed: false,
        votes: 0,
        createdAt: '2026-07-01T10:00:00.000Z',
      })),
      plans: [],
      activePlanId: null,
      activity: [],
      profile: { statureCm: null },
      votedExerciseIds: [],
    })

    cy.get('[data-cy=tab-community]').click()
    // Prima pagina: 24 card e il contatore che dice quante ne restano
    cy.get('[data-cy=exercise-item]').should('have.length', 24)
    cy.get('[data-cy=shown-count]').should('have.text', '24 di 30 esercizi')
    cy.get('[data-cy=show-more]').click()
    cy.get('[data-cy=exercise-item]').should('have.length', 30)
    cy.get('[data-cy=show-more]').should('not.exist')

    // La ricerca restringe (e scrive ?q= nell'URL: i filtri sono condivisibili)
    cy.get('[data-cy=filter-search]').type('panca')
    cy.get('[data-cy=exercise-item]').should('have.length', 1).and('contain.text', 'Panca piana')
    cy.location('search').should('contain', 'q=panca')
  })

  it('i dati persistono dopo il ricaricamento della pagina', () => {
    proponiEsercizio('Affondi', 'https://youtu.be/dQw4w9WgXcQ')

    cy.reload()
    cy.get('[data-cy=exercise-item]').should('contain.text', 'Affondi')
  })
})
