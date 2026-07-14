// E2E del percorso critico M2 (issue #13): profilo → proposta → voto → filtro per statura.

const profiloConStatura = {
  schemaVersion: 2,
  exercises: [
    {
      id: 'seed-basso',
      name: 'Esercizio per bassi',
      description: 'Fuori fascia per il profilo',
      youtubeUrl: 'https://youtu.be/BBBBBBBBBBB',
      muscleGroup: 'legs',
      stature: { minCm: 150, maxCm: 165 },
      faceBlurConfirmed: true,
      votes: 0,
      createdAt: '2026-07-01T10:00:00.000Z',
    },
  ],
  plans: [],
  activity: [],
  profile: { statureCm: 180 },
  votedExerciseIds: [],
}

describe('Percorso completo esercizi (M2)', () => {
  it('propone, vota e filtra per statura', () => {
    cy.visitWithData(profiloConStatura)

    // Proposta con fascia che comprende la statura del profilo (180 cm)
    cy.apriFormProposta()
    cy.get('[data-cy=exercise-name]').type('Rematore con bilanciere')
    cy.scegliGruppo('back')
    cy.get('[data-cy=exercise-stature-min]').type('170')
    cy.get('[data-cy=exercise-stature-max]').type('195')
    cy.get('[data-cy=exercise-youtube]').type('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    cy.get('[data-cy=video-preview]').should('be.visible')
    cy.scegliOpzione('exercise-difficulty', 'Media')
    cy.get('[data-cy=exercise-submit]').click()

    cy.get('[data-cy=exercise-item]').should('have.length', 2)

    // Voto dalla lista
    cy.contains('[data-cy=exercise-item]', 'Rematore con bilanciere')
      .find('[data-cy=exercise-upvote]')
      .click()

    // Filtro "Adatti a me": resta solo l'esercizio in fascia, con il voto registrato
    cy.get('[data-cy=filter-suitable]').check()
    cy.get('[data-cy=exercise-item]').should('have.length', 1).and('contain.text', 'Rematore')
    cy.get('[data-cy=exercise-votes]').should('have.text', '1')
    cy.get('[data-cy=exercise-upvote]').should('have.attr', 'aria-pressed', 'true')

    // I filtri vivono nella query string (condivisibili)
    cy.location('search').should('contain', 'adatti=1')
  })

  it('chiede la statura al primo uso del filtro e poi lo applica', () => {
    cy.visit('/', { onBeforeLoad: (win) => win.localStorage.clear() })

    cy.get('[data-cy=filter-suitable]').check()
    cy.get('[data-cy=stature-required]').should('be.visible')

    cy.get('[data-cy=stature-input]').type('180')
    cy.get('[data-cy=stature-save]').click()
    cy.get('[data-cy=stature-required]').should('not.exist')
  })
})
