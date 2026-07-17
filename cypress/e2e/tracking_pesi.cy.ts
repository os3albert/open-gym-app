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
      muscleGroup: 'back',
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

const WEEKDAYS_BY_GETDAY = [
  'Domenica',
  'Lunedì',
  'Martedì',
  'Mercoledì',
  'Giovedì',
  'Venerdì',
  'Sabato',
]

/**
 * Il seed con la scheda attiva: da M18 i grafici vivono nel carosello dell'allenamento.
 * In forma v6 GIÀ pronta: le migrazioni dei seed antichi riscrivono schede e scheda attiva.
 */
const seedConScheda = {
  ...seed,
  schemaVersion: 6,
  exercises: seed.exercises.map((e) => ({ ...e, difficulty: 'medium' })),
  plans: [
    {
      id: 'p1',
      name: 'Full Body',
      days: [
        {
          name: WEEKDAYS_BY_GETDAY[new Date().getDay()],
          entries: [{ exerciseId: 'ex-stacco', sets: 3, reps: 8 }],
        },
      ],
      votes: 0,
    },
  ],
  activePlanId: 'p1',
}

describe('Tracking pesi (M3)', () => {
  it('suggerisce il carico dallo storico e la sessione persiste fra ricarichi', () => {
    cy.visitWithData(seed)

    cy.get('[data-cy=tab-allenamento]').click()
    cy.scegliOpzione('session-exercise-select', 'Stacco da terra')

    // Il peso proposto è quello dell'ultima sessione
    cy.get('[data-cy=set-weight]').should('have.value', '100')
    cy.get('[data-cy=set-reps]').should('have.value', '5')

    cy.get('[data-cy=add-set]').click()
    cy.get('[data-cy=set-chip]').should('contain.text', '100 kg × 5')

    // Persistenza fra ricarichi (lo Storico come vista non esiste più: fa fede la sessione)
    cy.reload()
    cy.get('[data-cy=tab-allenamento]').click()
    cy.scegliOpzione('session-exercise-select', 'Stacco da terra')
    cy.get('[data-cy=set-chip]').should('contain.text', '100 kg × 5')
  })

  it('i controlli sotto il carosello cambiano metrica e periodo dei grafici (M18)', () => {
    cy.visitWithData(seedConScheda)
    cy.get('[data-cy=tab-allenamento]').click()

    // Default: peso e ripetizioni insieme, senza scegliere nessun esercizio
    cy.get('[data-cy=dual-trend-chart]')
      .should('have.attr', 'aria-label')
      .and('include', 'Andamento di peso e ripetizioni')

    // La metrica singola porta nel carosello il grafico (e il contratto) dello Storico
    cy.scegliOpzione('metric-select', 'Peso massimo')
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

    // Il periodo vale per gli stessi grafici: «Tutto lo storico» non perde il punto di ieri
    cy.scegliOpzione('period-select', 'Tutto lo storico')
    cy.get('[data-cy=trend-chart]').should('have.attr', 'aria-label').and('include', 'volume')

    // E la tab Storico non esiste più
    cy.get('[data-cy=tab-storico]').should('not.exist')
  })

  it('la rotella dei valori sceglie il carico senza digitare (M12)', () => {
    cy.visitWithData({ ...seed, activity: [] })

    cy.get('[data-cy=tab-allenamento]').click()
    cy.scegliOpzione('session-exercise-select', 'Stacco da terra')

    cy.scegliNumero('set-weight', '100')
    cy.get('[data-cy=set-weight]').should('have.value', '100')
    cy.scegliNumero('set-reps', '8')
    cy.get('[data-cy=set-reps]').should('have.value', '8')

    cy.get('[data-cy=add-set]').click()
    cy.get('[data-cy=set-chip]').should('contain.text', '100 kg × 8')
  })

  it('senza storico il campo resta vuoto; nello spinner si scrive anche un fuori scala (M14)', () => {
    cy.visitWithData({ ...seed, activity: [] })

    cy.get('[data-cy=tab-allenamento]').click()
    cy.scegliOpzione('session-exercise-select', 'Stacco da terra')

    cy.get('[data-cy=set-weight]').should('have.value', '')
    // 317,5 kg non sta in nessuna rotella ragionevole: si scrive nel modale
    cy.digitaNumero('set-weight', '317.5')
    cy.get('[data-cy=set-weight]').should('have.value', '317.5')
  })

  it('una serie non valida viene rifiutata con un errore', () => {
    cy.visitWithData({ ...seed, activity: [] })

    cy.get('[data-cy=tab-allenamento]').click()
    cy.scegliOpzione('session-exercise-select', 'Stacco da terra')
    cy.scegliNumero('set-weight', '60')
    cy.get('[data-cy=add-set]').click()

    cy.get('[data-cy=session-error]').should('be.visible')
  })
})

export {}
