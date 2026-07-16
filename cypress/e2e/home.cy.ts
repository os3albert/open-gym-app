// E2E della Home (M16): l'atterraggio con weekly progress e giorni della scheda attiva,
// e il click sul giorno che apre l'allenamento CON quel giorno.

function isoOggi(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

const seed = {
  schemaVersion: 6,
  exercises: [
    {
      id: 'ex-panca',
      name: 'Panca piana',
      description: '',
      youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
      muscleGroup: 'chest',
      difficulty: 'medium',
      faceBlurConfirmed: false,
      votes: 0,
      createdAt: '2026-07-01T10:00:00.000Z',
    },
    {
      id: 'ex-squat',
      name: 'Squat',
      description: '',
      youtubeUrl: 'https://youtu.be/BBBBBBBBBBB',
      muscleGroup: 'legs',
      difficulty: 'medium',
      faceBlurConfirmed: false,
      votes: 0,
      createdAt: '2026-07-01T11:00:00.000Z',
    },
  ],
  plans: [
    {
      id: 'p1',
      name: 'Push Pull Legs',
      days: [
        { name: 'Giorno A', entries: [{ exerciseId: 'ex-panca', sets: 3, reps: 8 }] },
        { name: 'Giorno B', entries: [{ exerciseId: 'ex-squat', sets: 5, reps: 5 }] },
      ],
      votes: 0,
    },
  ],
  activePlanId: 'p1',
  activity: [
    { id: 'a1', exerciseId: 'ex-panca', date: isoOggi(), sets: [{ weightKg: 80, reps: 8 }] },
  ],
  profile: { statureCm: null },
  votedExerciseIds: [],
}

describe('Home (M16)', () => {
  it('atterra sulla Home: settimana, giorni della scheda, e il click apre QUEL giorno', () => {
    cy.visitWithData(seed)

    // Si atterra qui, senza parametri: progresso della settimana coi dati di oggi (80×8 = 640)
    cy.get('[data-cy=home-week-chart]')
      .should('have.attr', 'aria-label')
      .and('equal', 'Progresso della settimana: 1 giorno di allenamento, volume totale 640 kg×reps')

    // I giorni della scheda attiva
    cy.get('[data-cy=home-day]').should('have.length', 2)
    cy.contains('[data-cy=home-day]', 'Giorno B').should('contain.text', 'Squat')

    // Il click porta all'allenamento con il Giorno B già scelto
    cy.contains('[data-cy=home-day]', 'Giorno B').find('[data-cy=home-day-open]').click()
    cy.get('[data-cy=today-day-name]').should('contain.text', 'Giorno B')
    cy.get('[data-cy=today-entry]').should('have.length', 1).and('contain.text', 'Squat')
    cy.location('search').should('contain', 'vista=allenamento').and('contain', 'giorno=Giorno')
  })

  it('senza scheda attiva invita a crearne una, e il bottone porta alle Schede', () => {
    cy.visitWithData({ ...seed, plans: [], activePlanId: null, activity: [] })

    cy.get('[data-cy=home-week-empty]').should('be.visible')
    cy.get('[data-cy=home-no-plan]').should('be.visible')
    cy.get('[data-cy=home-go-to-plans]').click()
    cy.get('[data-cy=plan-name-input]').should('be.visible')
  })
})

export {}
