// E2E della M5 (issue #26): layout mobile senza scroll orizzontale e tema chiaro/scuro.

const seed = {
  schemaVersion: 3,
  exercises: [
    {
      id: 'ex-1',
      name: 'Panca piana con fermo al petto',
      description: 'Descrizione lunga per stressare il layout su schermi stretti.',
      youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
      muscleGroup: 'chest',
      stature: { minCm: 165, maxCm: 195 },
      faceBlurConfirmed: true,
      votes: 12,
      createdAt: '2026-07-01T10:00:00.000Z',
    },
  ],
  plans: [
    {
      id: 'p1',
      name: 'Full Body con nome piuttosto lungo',
      days: [{ name: 'Lunedì', entries: [{ exerciseId: 'ex-1', sets: 3, reps: 8 }] }],
      votes: 0,
    },
  ],
  activePlanId: 'p1',
  activity: [
    { id: 'a1', exerciseId: 'ex-1', date: '2026-07-01', sets: [{ weightKg: 80, reps: 8 }] },
  ],
  profile: { statureCm: null },
  votedExerciseIds: [],
}

function assertNoHorizontalScroll() {
  cy.document().then((doc) => {
    // clientWidth non va bene come limite: la scrollbar verticale lo riduce sempre
    expect(doc.documentElement.scrollWidth, 'larghezza del contenuto vs viewport').to.be.lte(
      Cypress.config('viewportWidth'),
    )
  })
}

describe('Rifinitura UX (M5)', () => {
  it('a 375 px nessuna vista ha lo scroll orizzontale', () => {
    cy.viewport(375, 667)
    cy.visitWithData(seed)

    for (const tab of [
      'tab-community',
      'tab-schede',
      'tab-allenamento',
      'tab-storico',
      'tab-impostazioni',
    ]) {
      cy.get(`[data-cy=${tab}]`).click()
      assertNoHorizontalScroll()
    }

    // Anche con l'editor della scheda aperto (la vista più densa)
    cy.get('[data-cy=tab-schede]').click()
    cy.get('[data-cy=plan-edit]').click()
    assertNoHorizontalScroll()
  })

  it("a 320 px l'etichetta della voce scelta ci sta intera, nel suo tasto (M15)", () => {
    // Lo schermo più stretto in circolazione. Le etichette più lunghe dell'app: se una non
    // entra, sono queste. Sbordavano DENTRO la pillola (che ritaglia), quindi senza scroll
    // orizzontale: il test qui sopra non le avrebbe mai viste.
    cy.viewport(320, 568)
    cy.visitWithData(seed)

    for (const tab of ['tab-allenamento', 'tab-impostazioni']) {
      cy.get(`[data-cy=${tab}]`).click()
      cy.get(`[data-cy=${tab}]`).then(($tab) => {
        const tasto = $tab[0].getBoundingClientRect()
        const el = $tab.find('.MuiBottomNavigationAction-label')[0]
        const etichetta = el.getBoundingClientRect()
        // Dentro il suo tasto: mai più a cavallo delle icone vicine
        expect(etichetta.left, `${tab}: bordo sinistro`).to.be.at.least(tasto.left)
        expect(etichetta.right, `${tab}: bordo destro`).to.be.at.most(tasto.right)
        // E per intero: il tema si tiene l'ellissi come rete, ma qui non deve servire
        expect(el.scrollWidth, `${tab}: larghezza del testo`).to.be.at.most(el.clientWidth)
      })
    }
  })

  it('il tema si può forzare e sopravvive al ricaricamento', () => {
    // Niente onBeforeLoad: la test isolation pulisce già localStorage, e le opzioni
    // della visit verrebbero riapplicate anche da cy.reload() cancellando la preferenza.
    cy.visit('/')
    cy.apriImpostazioni()
    // In «auto» il tema segue il sistema (che in headless può essere chiaro o scuro)
    // Il select è un menu MUI: la scelta corrente si legge dal testo, non da un value
    cy.get('[data-cy=theme-select]').should('have.text', 'Auto')
    cy.get('html').should('have.attr', 'data-theme')

    cy.scegliOpzione('theme-select', 'Scuro')
    cy.get('html').should('have.attr', 'data-theme', 'dark')

    cy.scegliOpzione('theme-select', 'Chiaro')
    cy.get('html').should('have.attr', 'data-theme', 'light')

    cy.reload()
    cy.get('html').should('have.attr', 'data-theme', 'light')
    cy.apriImpostazioni()
    cy.get('[data-cy=theme-select]').should('have.text', 'Chiaro')
  })
})

export {}
