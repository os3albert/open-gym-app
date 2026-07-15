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
    muscleGroup: 'chest',
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

    // Il set log ha una riga per serie prevista (3×8); la prima si registra dalla sua spunta
    cy.get('[data-cy=set-row]').should('have.length', 3)
    cy.get('[data-cy=set-row-record]').first().click()
    cy.get('[data-cy=set-row-done]').should('have.length', 1)
    cy.get('[data-cy=set-row-weight]').first().should('contain.text', '100')

    // La serie finisce nello storico dei pesi
    cy.get('[data-cy=tab-storico]').click()
    cy.get('[data-cy=session-item]').should('have.length', 2)
  })

  it('il carosello raggiunge tutti gli esercizi con le frecce (M14)', () => {
    // Su schermo da telefono: una card per schermata, le vicine spuntano appena
    cy.viewport('iphone-x')
    const oggi = WEEKDAYS_BY_GETDAY[new Date().getDay()]
    const molti = Array.from({ length: 4 }, (_, i) => ({
      id: `ex-c${i}`,
      name: `Esercizio ${i + 1}`,
      description: '',
      youtubeUrl: `https://youtu.be/CCCCCCCCCC${i}`,
      muscleGroup: 'chest',
      faceBlurConfirmed: true,
      votes: 0,
      createdAt: '2026-07-01T10:00:00.000Z',
    }))
    cy.visitWithData({
      ...seed,
      exercises: molti,
      plans: [
        {
          id: 'p1',
          name: 'Full Body',
          days: [{ name: oggi, entries: molti.map((e) => ({ exerciseId: e.id, sets: 2, reps: 8 })) }],
          votes: 0,
        },
      ],
      activePlanId: 'p1',
    })

    cy.get('[data-cy=tab-allenamento]').click()
    cy.get('[data-cy=today-entry]').should('have.length', 4)
    // L'ultima card sta ben oltre la finestra del carosello
    cy.get('[data-cy=today-entry]').last().should('not.be.visible')

    // Avanti fino in fondo, una card per click; lo scrollLeft che cresce serializza
    // i click rispetto all'animazione di scorrimento
    cy.get('[data-cy=today-next]').click()
    cy.get('[data-cy=today-carousel]').invoke('scrollLeft').should('be.greaterThan', 150)
    cy.get('[data-cy=today-next]').click()
    cy.get('[data-cy=today-carousel]').invoke('scrollLeft').should('be.greaterThan', 460)
    cy.get('[data-cy=today-next]').click()
    cy.get('[data-cy=today-carousel]').invoke('scrollLeft').should('be.greaterThan', 770)
    cy.get('[data-cy=today-entry]').last().should('be.visible')
    cy.get('[data-cy=today-entry]').first().should('not.be.visible')

    // E indietro
    cy.get('[data-cy=today-prev]').click()
    cy.get('[data-cy=today-carousel]').invoke('scrollLeft').should('be.lessThan', 780)
  })

  it('«+ Aggiungi serie» aggiunge una riga extra al set log (M14)', () => {
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
    })

    cy.get('[data-cy=tab-allenamento]').click()
    cy.get('[data-cy=set-row]').should('have.length', 3)
    cy.get('[data-cy=today-add-set]').click()
    cy.get('[data-cy=set-row]').should('have.length', 4)
  })
})

export {}
