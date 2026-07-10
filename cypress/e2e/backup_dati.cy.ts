// E2E del backup: export del JSON su file e import da file.

describe('Backup dei dati', () => {
  beforeEach(() => {
    cy.visit('/', { onBeforeLoad: (win) => win.localStorage.clear() })
  })

  it('importa un backup JSON da file', () => {
    cy.get('[data-cy=import-input]').selectFile('cypress/fixtures/backup-esempio.json')

    cy.get('[data-cy=backup-message]').should('contain.text', 'importato correttamente')
    cy.get('[data-cy=exercise-item]').should('have.length', 1).and('contain.text', 'Military press')
  })

  it('segnala un file di backup non valido', () => {
    cy.get('[data-cy=import-input]').selectFile('cypress/fixtures/backup-non-valido.json')

    cy.get('[data-cy=backup-message]').should('contain.text', 'non riconosciuto')
    cy.get('[data-cy=exercise-item]').should('not.exist')
  })

  it('esporta un backup JSON scaricabile', () => {
    cy.get('[data-cy=exercise-name]').type('Panca piana')
    cy.get('[data-cy=exercise-youtube]').type('https://youtu.be/dQw4w9WgXcQ')
    cy.get('[data-cy=exercise-submit]').click()

    cy.get('[data-cy=export-button]').click()

    cy.readFile('cypress/downloads/open-gym-backup.json').then((backup) => {
      expect(backup.schemaVersion).to.equal(1)
      expect(backup.exercises).to.have.length(1)
      expect(backup.exercises[0].name).to.equal('Panca piana')
    })
  })
})
