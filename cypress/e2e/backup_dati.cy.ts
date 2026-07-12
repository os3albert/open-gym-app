// E2E del backup: export del JSON su file, import con scelta Sostituisci/Unisci
// e migrazione degli schemi vecchi.

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

describe('Backup dei dati', () => {
  beforeEach(() => {
    cy.visit('/', { onBeforeLoad: (win) => win.localStorage.clear() })
  })

  it('importa un backup JSON v1 sostituendo tutto e migrandolo allo schema corrente', () => {
    // La fixture è volutamente un backup v1: l'import deve migrarla senza perdite
    cy.get('[data-cy=import-input]').selectFile('cypress/fixtures/backup-esempio.json', {
      force: true,
    })

    cy.get('[data-cy=import-choice]').should('be.visible')
    cy.get('[data-cy=import-replace]').click()

    cy.get('[data-cy=backup-message]').should('contain.text', 'importato correttamente')
    cy.get('[data-cy=exercise-item]').should('have.length', 1).and('contain.text', 'Military press')
  })

  it("l'unione non duplica un esercizio con lo stesso video già presente", () => {
    // Localmente c'è lo stesso video della fixture (forma youtu.be) con un altro nome
    cy.visitWithData({
      schemaVersion: 3,
      exercises: [
        {
          id: 'ex-locale',
          name: 'Lento avanti',
          description: '',
          youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
          muscleGroup: 'Spalle',
          faceBlurConfirmed: true,
          votes: 0,
          createdAt: '2026-07-02T10:00:00.000Z',
        },
      ],
      plans: [],
      activePlanId: null,
      activity: [],
      profile: { statureCm: null },
      votedExerciseIds: [],
    })

    cy.get('[data-cy=import-input]').selectFile('cypress/fixtures/backup-esempio.json', {
      force: true,
    })
    cy.get('[data-cy=import-merge]').click()

    cy.get('[data-cy=backup-message]').should('contain.text', 'senza duplicati')
    // Stesso video: resta il solo esercizio locale
    cy.get('[data-cy=exercise-item]').should('have.length', 1).and('contain.text', 'Lento avanti')
  })

  it('segnala un file di backup non valido senza proporre scelte', () => {
    cy.get('[data-cy=import-input]').selectFile('cypress/fixtures/backup-non-valido.json', {
      force: true,
    })

    cy.get('[data-cy=backup-message]').should('contain.text', 'non riconosciuto')
    cy.get('[data-cy=import-choice]').should('not.exist')
    cy.get('[data-cy=exercise-item]').should('not.exist')
  })

  it('esporta un backup JSON datato con lo schema corrente e la data di export', () => {
    cy.get('[data-cy=exercise-name]').type('Panca piana')
    cy.get('[data-cy=exercise-youtube]').type('https://youtu.be/dQw4w9WgXcQ')
    cy.get('[data-cy=face-blur-checkbox]').check()
    cy.get('[data-cy=exercise-submit]').click()

    cy.get('[data-cy=export-button]').click()

    cy.readFile(`cypress/downloads/open-gym-backup-${todayIso()}.json`).then((backup) => {
      expect(backup.schemaVersion).to.equal(3)
      expect(backup.exportedAt).to.be.a('string')
      expect(backup.exercises).to.have.length(1)
      expect(backup.exercises[0].name).to.equal('Panca piana')
      expect(backup.exercises[0].faceBlurConfirmed).to.equal(true)
      expect(backup.profile).to.deep.equal({ statureCm: null })
    })
  })
})

export {}
