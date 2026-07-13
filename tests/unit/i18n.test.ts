// Impianto delle traduzioni: dizionari allineati, codici d'errore che diventano frasi.
import { expect } from 'chai'
import {
  EMPTY_NAME_ERROR,
  FACE_BLUR_REQUIRED_ERROR,
  INVALID_YOUTUBE_LINK_ERROR,
} from '../../src/domain/exercises'
import { LANGUAGES, isLanguage, makeTranslate, translateError } from '../../src/i18n'
import { en } from '../../src/i18n/en'
import { it as itDict } from '../../src/i18n/it'

describe('dizionari', () => {
  it('hanno esattamente le stesse chiavi', () => {
    // Il compilatore lo garantisce già (en è tipato su it): questo test difende dal caso
    // in cui qualcuno aggiri i tipi con un cast. Una traduzione mancante non deve uscire.
    expect(Object.keys(en).sort()).to.deep.equal(Object.keys(itDict).sort())
  })

  it('non lasciano voci vuote', () => {
    const vuote = Object.entries(en).filter(([, value]) => value === '')
    expect(vuote).to.have.lengthOf(0)
  })

  it('riconosce le lingue supportate', () => {
    expect(LANGUAGES).to.deep.equal(['it', 'en'])
    expect(isLanguage('it')).to.equal(true)
    expect(isLanguage('de')).to.equal(false)
  })
})

describe('traduzione', () => {
  it('rende la frase nella lingua scelta', () => {
    expect(makeTranslate('it')('community.proposalSent')).to.equal(
      'Proposta inviata alla community!',
    )
    expect(makeTranslate('en')('community.proposalSent')).to.equal(
      'Proposal sent to the community!',
    )
  })

  it('interpola i parametri', () => {
    const t = makeTranslate('it')
    expect(t('community.localOnly', { reason: 'offline' })).to.equal(
      'Salvato solo sul dispositivo: offline',
    )
  })
})

describe('errori di dominio', () => {
  it('traduce il codice lanciato dal dominio', () => {
    // È il contratto nuovo: il dominio lancia CODICI, la frase la sceglie la lingua
    expect(EMPTY_NAME_ERROR).to.equal('EMPTY_NAME')
    expect(translateError(makeTranslate('it'), new Error(EMPTY_NAME_ERROR))).to.equal(
      "Il nome dell'esercizio è obbligatorio",
    )
    expect(translateError(makeTranslate('en'), new Error(EMPTY_NAME_ERROR))).to.equal(
      'The exercise name is required',
    )
  })

  it('ogni codice di dominio ha la sua frase', () => {
    const t = makeTranslate('it')
    for (const code of [INVALID_YOUTUBE_LINK_ERROR, FACE_BLUR_REQUIRED_ERROR]) {
      expect(translateError(t, new Error(code))).to.not.equal(code)
    }
  })

  it('un errore imprevisto si mostra così com’è, invece di sparire', () => {
    // Il worker può rispondere con un testo che non è un codice noto (es. un 503 di Cloudflare):
    // meglio mostrarlo che ingoiarlo
    const t = makeTranslate('it')
    expect(translateError(t, new Error('Community offline'))).to.equal('Community offline')
  })
})
