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
    cy.scegliGiorno('Lunedì')
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

  it("un esercizio del catalogo (GIF, senza video) si vede animato nel carosello con l'attribuzione (M16)", () => {
    // GIF in data: URI: il test resta offline, e la CSP della build la ammette (img-src data:)
    const gif = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    const oggi = WEEKDAYS_BY_GETDAY[new Date().getDay()]
    cy.visitWithData({
      ...seed,
      schemaVersion: 6,
      exercises: [
        {
          id: 'ex-gif',
          name: 'Military press',
          description: 'Dal catalogo',
          youtubeUrl: '',
          gifUrl: gif,
          muscleGroup: 'shoulders',
          difficulty: 'medium',
          faceBlurConfirmed: false,
          votes: 0,
          createdAt: '2026-07-01T10:00:00.000Z',
        },
      ],
      plans: [
        {
          id: 'p1',
          name: 'Full Body',
          days: [{ name: oggi, entries: [{ exerciseId: 'ex-gif', sets: 3, reps: 8 }] }],
          votes: 0,
        },
      ],
      activePlanId: 'p1',
    })

    cy.get('[data-cy=tab-allenamento]').click()
    cy.get('[data-cy=gif-media] img').should('have.attr', 'src', gif).and('be.visible')
    cy.get('[data-cy=gif-media]').should('contain.text', '© Gym visual')
  })

  it('un esercizio si aggiunge alla scheda dalla Community, senza cambiare vista (M15)', () => {
    cy.visitWithData({
      ...seed,
      plans: [{ id: 'p1', name: 'Full Body', days: [{ name: 'Lunedì', entries: [] }], votes: 0 }],
      activePlanId: 'p1',
    })

    // Si parte dalla lista della Community: è lì che si sfoglia e si decide
    cy.get('[data-cy=tab-community]').click()
    cy.get('[data-cy=exercise-item]')
      .contains('[data-cy=exercise-item]', 'Squat')
      .find('[data-cy=exercise-add-to-plan]')
      .click()

    // Scheda attiva e unico giorno già scelti: si cambia solo il target
    cy.get('[data-cy=add-to-plan-plan]').should('have.text', 'Full Body')
    cy.get('[data-cy=add-to-plan-day]').should('have.text', 'Lunedì')
    cy.scegliNumero('add-to-plan-sets', '4')
    cy.scegliNumero('add-to-plan-reps', '6')
    cy.get('[data-cy=add-to-plan-confirm]').click()

    cy.get('[data-cy=add-to-plan-success]').should('contain.text', 'è ora in Full Body — Lunedì')

    // E nella scheda c'è per davvero
    cy.get('[data-cy=tab-schede]').click()
    cy.get('[data-cy=plan-edit]').click()
    cy.get('[data-cy=plan-entry-text]').should('have.text', 'Squat — 4×6')
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
    // Prefill dall'ULTIMA sessione (M17): 100 kg × 5, non più il target della scheda
    cy.get('[data-cy=today-weight]').should('have.value', '100')
    cy.get('[data-cy=today-reps]').should('have.value', '5')

    // La spunta mette in BOZZA (M17); lo storico si tocca solo con la conferma esplicita
    cy.get('[data-cy=set-row]').should('have.length', 3)
    cy.get('[data-cy=set-row-record]').first().click()
    cy.get('[data-cy=set-row-draft]').should('have.length', 1)
    cy.get('[data-cy=set-row-done]').should('not.exist')
    cy.get('[data-cy=today-confirm-history]').click()
    cy.get('[data-cy=set-row-done]').should('have.length', 1)
    cy.get('[data-cy=set-row-weight]').first().should('contain.text', '100')

    // Sotto il set log, le statistiche: pesi e ripetizioni insieme, aggiornate alla conferma
    // (ieri 100×5, oggi la serie confermata 100×5 — reps precompilate dall'ultima sessione)
    cy.get('[data-cy=dual-trend-chart]')
      .should('have.attr', 'aria-label')
      .and('match', /^Andamento di peso e ripetizioni: peso da 100 a 100 kg, ripetizioni da 5 a 5/)

    // La prova che la serie è salvata è il grafico qui sopra (lo Storico come vista non
    // esiste più, M18): ha già i punti di ieri e di oggi
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
          days: [
            { name: oggi, entries: molti.map((e) => ({ exerciseId: e.id, sets: 2, reps: 8 })) },
          ],
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

  it('il timer parte dal FAB e la pausa scatta da sola alla serie registrata (M14)', () => {
    // Il service worker della PWA risponde alle navigazioni dalla cache, SCAVALCANDO il
    // proxy di Cypress: la pagina arriva senza le iniezioni del runner e cy.clock NON si
    // riapplica (in dev, senza SW, non si vede). Qui l'orologio finto è tutto, quindi il SW
    // va tolto di mezzo PRIMA delle visite vere. Tre insidie scoperte a caro prezzo:
    // l'app ri-registra il SW a ogni mount (lo si stuba su OGNI finestra del test);
    // cy.visit sullo STESSO url non naviga davvero; e cy.reload eredita il controller
    // anche a registrazione rimossa. Perciò: si atterra su un url di comodo, si
    // disinstalla, e la PRIMA visita vera (url diverso) nasce senza controller.
    cy.on('window:before:load', (win) => {
      win.navigator.serviceWorker.register = () =>
        Promise.reject(new Error('service worker disattivato nel test'))
    })
    // Il fallimento (voluto) della registrazione arriva come eccezione non gestita
    cy.on('uncaught:exception', (err) => !/service ?worker/i.test(err.message))
    cy.visit('/?senza-sw')
    cy.window().then({ timeout: 15000 }, (win) => {
      // Su una pagina servita dal SW lo stub qui sopra NON si applica (il documento arriva
      // dalla cache, senza le iniezioni di Cypress) e l'app ri-registra per davvero, con la
      // registrazione che può atterrare DOPO una prima spazzata. Si insiste finché non si
      // legge «zero registrazioni» per più letture consecutive.
      function spazzaFinoAZero(vuoteDiFila: number): Promise<void> {
        return win.navigator.serviceWorker.getRegistrations().then((regs) => {
          if (regs.length === 0 && vuoteDiFila >= 2) return
          return Promise.all(regs.map((reg) => reg.unregister()))
            .then(() => new Promise<void>((resolve) => win.setTimeout(resolve, 300)))
            .then(() => spazzaFinoAZero(regs.length === 0 ? vuoteDiFila + 1 : 0))
        })
      }
      return spazzaFinoAZero(0)
    })

    // Si congela SOLO l'orologio del timer: il resto dell'app vive di setTimeout veri
    cy.clock(Date.now(), ['setInterval', 'clearInterval', 'Date'])
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
    cy.get('[data-cy=workout-timer]').should('contain.text', 'Timer')
    cy.get('[data-cy=workout-timer-stop]').should('not.exist')

    // Avvio: conta il tempo di esercizio
    cy.get('[data-cy=workout-timer]').click()
    cy.tick(65_000)
    cy.get('[data-cy=workout-timer]').should('contain.text', 'Esercizio 1:05')

    // Registro una serie: la pausa parte da sola e conta da zero
    cy.get('[data-cy=set-row-record]').first().click()
    cy.tick(30_000)
    cy.get('[data-cy=workout-timer]').should('contain.text', 'Pausa 0:30')

    // Un tocco chiude la pausa; lo stop riporta il FAB a «Timer»
    cy.get('[data-cy=workout-timer]').click()
    cy.get('[data-cy=workout-timer]').should('contain.text', 'Esercizio 1:35')
    cy.get('[data-cy=workout-timer-stop]').click()
    cy.get('[data-cy=workout-timer]').should('contain.text', 'Timer')
    cy.get('[data-cy=workout-timer-stop]').should('not.exist')
  })
})

export {}
