// E2E del percorso critico M3 (issue #17): sessione ieri → suggerimento oggi → storico completo.

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

const seed = {
  schemaVersion: 2,
  exercises: [
    {
      id: 'ex-stacco',
      name: 'Stacco da terra',
      description: 'Stacco convenzionale',
      youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
      muscleGroup: 'Schiena',
      faceBlurConfirmed: true,
      votes: 0,
      createdAt: '2026-07-01T10:00:00.000Z',
    },
  ],
  plans: [],
  // Ieri: 100 kg × 5 (sotto le ripetizioni obiettivo → si ripropone lo stesso carico)
  activity: [
    { id: 'a1', exerciseId: 'ex-stacco', date: isoDaysAgo(1), sets: [{ weightKg: 100, reps: 5 }] },
  ],
  profile: { statureCm: null },
  votedExerciseIds: [],
}

describe('Tracking pesi (M3)', () => {
  it('suggerisce il carico dallo storico e registra la nuova sessione', () => {
    cy.visitWithData(seed)

    cy.get('[data-cy=tab-allenamento]').click()
    cy.scegliOpzione('session-exercise-select', 'Stacco da terra')

    // Il peso proposto è quello dell'ultima sessione
    cy.get('[data-cy=set-weight]').should('have.value', '100')
    cy.get('[data-cy=set-reps]').should('have.value', '5')

    cy.get('[data-cy=add-set]').click()
    cy.get('[data-cy=set-chip]').should('contain.text', '100 kg × 5')

    // Lo storico mostra entrambe le sessioni e l'andamento
    cy.get('[data-cy=tab-storico]').click()
    cy.get('[data-cy=session-item]').should('have.length', 2)
    cy.scegliOpzione('history-exercise-select', 'Stacco da terra')
    cy.get('[data-cy=trend-chart]').should('be.visible')

    // Persistenza fra ricarichi
    cy.reload()
    cy.get('[data-cy=tab-storico]').click()
    cy.get('[data-cy=session-item]').should('have.length', 2)
  })

  it('il grafico segue la metrica scelta: peso, ripetizioni, volume', () => {
    cy.visitWithData(seed)

    cy.get('[data-cy=tab-storico]').click()
    cy.scegliOpzione('history-exercise-select', 'Stacco da terra')
    cy.get('[data-cy=trend-chart]').should('have.attr', 'aria-label').and('include', 'del carico')

    cy.scegliOpzione('metric-select', 'Ripetizioni totali')
    cy.get('[data-cy=trend-chart]')
      .should('have.attr', 'aria-label')
      .and('include', 'ripetizioni totali')
      .and('include', '5 reps')

    cy.scegliOpzione('metric-select', 'Volume (kg × reps)')
    cy.get('[data-cy=trend-chart]')
      .should('have.attr', 'aria-label')
      .and('include', 'volume')
      .and('include', '500 kg×reps')
  })

  it('senza storico il campo peso resta vuoto e i +/- funzionano', () => {
    cy.visitWithData({ ...seed, activity: [] })

    cy.get('[data-cy=tab-allenamento]').click()
    cy.scegliOpzione('session-exercise-select', 'Stacco da terra')

    cy.get('[data-cy=set-weight]').should('have.value', '')
    cy.get('[data-cy=weight-plus]').click().click()
    cy.get('[data-cy=set-weight]').should('have.value', '5')
    cy.get('[data-cy=reps-plus]').click()
    cy.get('[data-cy=set-reps]').should('have.value', '1')
  })

  it('una serie non valida viene rifiutata con un errore', () => {
    cy.visitWithData({ ...seed, activity: [] })

    cy.get('[data-cy=tab-allenamento]').click()
    cy.scegliOpzione('session-exercise-select', 'Stacco da terra')
    cy.get('[data-cy=set-weight]').type('60')
    cy.get('[data-cy=add-set]').click()

    cy.get('[data-cy=session-error]').should('be.visible')
  })
})

export {}
