// Test di integrazione: storage (localStorage di jsdom) + serializzazione import/export.
import { expect } from 'chai'
import { addExercise } from '../../src/domain/exercises'
import {
  exportToJson,
  importFromJson,
  INVALID_FORMAT_ERROR,
  INVALID_JSON_ERROR,
} from '../../src/services/importExport'
import {
  emptyData,
  loadData,
  loadDataResult,
  saveData,
  STORAGE_FULL_ERROR,
  STORAGE_KEY,
} from '../../src/services/storage'

const validInput = {
  name: 'Trazioni',
  description: 'Alla sbarra, presa prona',
  youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
  muscleGroup: 'back' as const,
  difficulty: 'medium' as const,
  faceBlurConfirmed: true,
}

beforeEach(() => {
  localStorage.clear()
})

describe('persistenza su localStorage', () => {
  it('salva e ricarica gli stessi dati (round-trip)', () => {
    const data = addExercise(emptyData(), validInput)
    saveData(data)
    expect(loadData()).to.deep.equal(data)
  })

  it("parte da uno stato vuoto se non c'è nulla di salvato", () => {
    expect(loadDataResult()).to.deep.equal({ status: 'empty', data: emptyData() })
  })

  it('segnala i dati corrotti e riparte da uno stato vuoto senza crash', () => {
    localStorage.setItem(STORAGE_KEY, '{corrotto!!!')
    expect(loadDataResult()).to.deep.equal({ status: 'corrupted', data: emptyData() })
  })

  it('con la quota esaurita lancia un errore esplicito', () => {
    const fullStorage = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException('quota', 'QuotaExceededError')
      },
    }
    expect(() => saveData(emptyData(), fullStorage)).to.throw(STORAGE_FULL_ERROR)
  })
})

describe('export/import JSON per il backup', () => {
  it('il backup esportato si reimporta identico', () => {
    const data = addExercise(emptyData(), validInput)
    expect(importFromJson(exportToJson(data))).to.deep.equal(data)
  })

  it('rifiuta JSON malformato', () => {
    expect(() => importFromJson('non json')).to.throw(INVALID_JSON_ERROR)
  })

  it('rifiuta JSON con struttura sconosciuta', () => {
    expect(() => importFromJson('{"qualcosa": 1}')).to.throw(INVALID_FORMAT_ERROR)
    expect(() =>
      importFromJson(
        JSON.stringify({ schemaVersion: 2, exercises: [{}], plans: [], activity: [] }),
      ),
    ).to.throw(INVALID_FORMAT_ERROR)
  })
})
