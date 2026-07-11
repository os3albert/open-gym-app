// E2E del backup: export del JSON su file, import da file e migrazione degli schemi vecchi.

describe('Backup dei dati', () => {
  beforeEach(() => {
    cy.visit('/', { onBeforeLoad: (win) => win.localStorage.clear() })
  })

  it('importa un backup JSON v1 migrandolo allo schema corrente', () => {
    // La fixture è volutamente un backup v1: l'import deve migrarla senza perdite
    cy.get('[data-cy=import-input]').selectFile('cypress/fixtures/backup-esempio.json')

    cy.get('[data-cy=backup-message]').should('contain.text', 'importato correttamente')
    cy.get('[data-cy=exercise-item]').should('have.length', 1).and('contain.text', 'Military press')
  })

  it('segnala un file di backup non valido', () => {
    cy.get('[data-cy=import-input]').selectFile('cypress/fixtures/backup-non-valido.json')

    cy.get('[data-cy=backup-message]').should('contain.text', 'non riconosciuto')
    cy.get('[data-cy=exercise-item]').should('not.exist')
  })

  it('esporta un backup JSON scaricabile con lo schema corrente', () => {
    cy.get('[data-cy=exercise-name]').type('Panca piana')
    cy.get('[data-cy=exercise-youtube]').type('https://youtu.be/dQw4w9WgXcQ')
    cy.get('[data-cy=face-blur-checkbox]').check()
    cy.get('[data-cy=exercise-submit]').click()

    cy.get('[data-cy=export-button]').click()

    cy.readFile('cypress/downloads/open-gym-backup.json').then((backup) => {
      expect(backup.schemaVersion).to.equal(3)
      expect(backup.exercises).to.have.length(1)
      expect(backup.exercises[0].name).to.equal('Panca piana')
      expect(backup.exercises[0].faceBlurConfirmed).to.equal(true)
      expect(backup.profile).to.deep.equal({ statureCm: null })
    })
  })
})
