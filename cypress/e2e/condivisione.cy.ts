// E2E del percorso critico M4 (issue #22): creazione → condivisione → importazione
// in un profilo pulito, verificando che la scheda importata sia identica.

const seed = {
  schemaVersion: 3,
  exercises: [
    {
      id: 'ex-trazioni',
      name: 'Trazioni',
      description: 'Alla sbarra',
      youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
      muscleGroup: 'back',
      faceBlurConfirmed: true,
      votes: 0,
      createdAt: '2026-07-01T10:00:00.000Z',
    },
    {
      id: 'ex-squat',
      name: 'Squat',
      description: '',
      youtubeUrl: 'https://youtu.be/BBBBBBBBBBB',
      muscleGroup: 'legs',
      faceBlurConfirmed: true,
      votes: 0,
      createdAt: '2026-07-01T11:00:00.000Z',
    },
  ],
  plans: [
    {
      id: 'p1',
      name: 'Push Pull Legs',
      days: [
        { name: 'Lunedì', entries: [{ exerciseId: 'ex-trazioni', sets: 3, reps: 8 }] },
        { name: 'Giovedì', entries: [{ exerciseId: 'ex-squat', sets: 5, reps: 5 }] },
      ],
      votes: 0,
    },
  ],
  activePlanId: null,
  activity: [],
  profile: { statureCm: null },
  votedExerciseIds: [],
}

describe('Condivisione delle schede (M4)', () => {
  it("dalla creazione all'importazione: la scheda importata è identica", () => {
    // Fase 1 — il mittente genera il codice della sua scheda su due giorni
    cy.visitWithData(seed)
    cy.get('[data-cy=tab-schede]').click()
    cy.get('[data-cy=plan-share]').click()

    cy.get('[data-cy=share-code]')
      .invoke('val')
      .then((code) => {
        // Fase 2 — un altro utente: localStorage completamente vuoto
        cy.window().then((win) => win.localStorage.clear())
        cy.reload()
        cy.get('[data-cy=tab-schede]').click()
        cy.get('[data-cy=plans-empty]').should('be.visible')

        cy.get('[data-cy=import-code-input]').type(String(code), {
          delay: 0,
          parseSpecialCharSequences: false,
        })
        cy.get('[data-cy=import-preview-btn]').click()

        // Anteprima con giorni ed esercizi prima di confermare
        cy.get('[data-cy=import-preview]').should('contain.text', 'Push Pull Legs')
        cy.get('[data-cy=import-preview-day]').should('have.length', 2)

        cy.get('[data-cy=import-confirm]').click()
        cy.get('[data-cy=import-success]').should('be.visible')
        cy.get('[data-cy=plan-item]')
          .should('contain.text', 'Push Pull Legs')
          .and('contain.text', 'Lunedì · Giovedì')

        // La scheda importata è identica: stessi giorni, esercizi e target
        cy.get('[data-cy=plan-edit]').click()
        cy.get('[data-cy=plan-entry-text]').should('have.length', 2)
        cy.get('[data-cy=plan-entry-text]').eq(0).should('have.text', 'Trazioni — 3×8')
        cy.get('[data-cy=plan-entry-text]').eq(1).should('have.text', 'Squat — 5×5')

        // «Prova questa scheda»: diventa la scheda attiva
        cy.get('[data-cy=try-imported-plan]').click()
        cy.get('[data-cy=active-badge]').should('be.visible')
      })
  })

  it('un codice corrotto viene rifiutato con un errore chiaro e nessun dato modificato', () => {
    cy.visit('/', { onBeforeLoad: (win) => win.localStorage.clear() })
    cy.get('[data-cy=tab-schede]').click()

    cy.get('[data-cy=import-code-input]').type('codice-palesemente-corrotto')
    cy.get('[data-cy=import-preview-btn]').click()

    cy.get('[data-cy=import-error]').should('contain.text', 'Codice di condivisione non valido')
    cy.get('[data-cy=plans-empty]').should('be.visible')
  })
})

export {}
