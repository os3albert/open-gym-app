// E2E della M4 (issue #18, #19): creazione della scheda per giorni e allenamento del giorno.

const WEEKDAYS_BY_GETDAY = [
  'Domenica',
  'Lunedì',
  'Martedì',
  'Mercoledì',
  'Giovedì',
  'Venerdì',
  'Sabato',
]

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

const exercises = [
  {
    id: 'ex-panca',
    name: 'Panca piana',
    description: '',
    youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
    muscleGroup: 'Petto',
    faceBlurConfirmed: true,
    votes: 0,
    createdAt: '2026-07-01T10:00:00.000Z',
  },
  {
    id: 'ex-squat',
    name: 'Squat',
    description: '',
    youtubeUrl: 'https://youtu.be/BBBBBBBBBBB',
    muscleGroup: 'Gambe',
    faceBlurConfirmed: true,
    votes: 0,
    createdAt: '2026-07-01T11:00:00.000Z',
  },
]

const seed = {
  schemaVersion: 3,
  exercises,
  plans: [],
  activePlanId: null,
  activity: [],
  profile: { statureCm: null },
  votedExerciseIds: [],
}

describe('Schede di allenamento (M4)', () => {
  it('crea una scheda con un giorno e un esercizio, la attiva e la ritrova al ricaricamento', () => {
    cy.visitWithData(seed)
    cy.get('[data-cy=tab-schede]').click()

    cy.get('[data-cy=plan-name-input]').type('Full Body 3x')
    cy.get('[data-cy=plan-create]').click()
    cy.get('[data-cy=plan-item]').should('contain.text', 'Full Body 3x')

    cy.get('[data-cy=plan-edit]').click()
    cy.get('[data-cy=day-name-input]').type('Lunedì')
    cy.get('[data-cy=add-day]').click()
    cy.get('[data-cy=plan-day-name]').should('have.text', 'Lunedì')

    // Target di default 3×8: basta scegliere l'esercizio
    cy.scegliOpzione('entry-exercise-select', 'Panca piana')
    cy.get('[data-cy=add-entry]').click()
    cy.get('[data-cy=plan-entry-text]').should('have.text', 'Panca piana — 3×8')

    cy.get('[data-cy=plan-activate]').click()
    cy.get('[data-cy=active-badge]').should('be.visible')

    // Persistenza fra ricarichi
    cy.reload()
    cy.get('[data-cy=tab-schede]').click()
    cy.get('[data-cy=plan-item]').should('contain.text', 'Full Body 3x')
    cy.get('[data-cy=active-badge]').should('be.visible')
  })

  it("l'allenamento del giorno propone gli esercizi della scheda attiva con il peso suggerito", () => {
    const oggi = WEEKDAYS_BY_GETDAY[new Date().getDay()]
    cy.visitWithData({
      ...seed,
      plans: [
        {
          id: 'p1',
          name: 'Full Body',
          days: [{ name: oggi, entries: [{ exerciseId: 'ex-squat', sets: 3, reps: 8 }] }],
          votes: 0,
        },
      ],
      activePlanId: 'p1',
      // Ieri 100 kg × 5 (sotto l'obiettivo): oggi si ripropone lo stesso carico
      activity: [
        {
          id: 'a1',
          exerciseId: 'ex-squat',
          date: isoDaysAgo(1),
          sets: [{ weightKg: 100, reps: 5 }],
        },
      ],
    })

    cy.get('[data-cy=tab-allenamento]').click()
    cy.get('[data-cy=today-workout]').should('contain.text', 'Full Body')
    cy.get('[data-cy=today-weight]').should('have.value', '100')
    cy.get('[data-cy=today-reps]').should('have.value', '8')

    cy.get('[data-cy=today-entry-complete]').click()
    cy.get('[data-cy=today-entry-done]').should('be.visible')
    cy.get('[data-cy=set-chip]').should('have.length', 3).and('contain.text', '100 kg × 8')

    // La sessione finisce nello storico dei pesi
    cy.get('[data-cy=tab-storico]').click()
    cy.get('[data-cy=session-item]').should('have.length', 2)
  })
})

export {}
