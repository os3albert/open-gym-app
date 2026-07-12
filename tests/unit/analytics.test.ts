// Regole delle statistiche anonime (M9): quando si misura e quando no.
import { expect } from 'chai'
import {
  analyticsAllowed,
  analyticsConfig,
  isOptedOut,
  setOptedOut,
} from '../../src/services/analytics'

const SRC = 'https://umami.example/script.js'
const ID = 'sito-123'

beforeEach(() => {
  localStorage.clear()
  vi.unstubAllEnvs()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

function configured() {
  vi.stubEnv('VITE_UMAMI_SRC', SRC)
  vi.stubEnv('VITE_UMAMI_WEBSITE_ID', ID)
}

describe('configurazione delle statistiche', () => {
  it("senza variabili d'ambiente le statistiche non esistono", () => {
    expect(analyticsConfig()).to.equal(null)
    expect(analyticsAllowed()).to.equal(false)
  })

  it('servono entrambe le variabili: solo lo script non basta', () => {
    vi.stubEnv('VITE_UMAMI_SRC', SRC)
    expect(analyticsConfig()).to.equal(null)
  })

  it("con l'istanza configurata le statistiche sono attive di default", () => {
    configured()
    expect(analyticsConfig()).to.deep.equal({ src: SRC, websiteId: ID })
    expect(analyticsAllowed()).to.equal(true)
  })
})

describe("scelta dell'utente e Do Not Track", () => {
  it("l'opt-out spegne le statistiche e sopravvive al ricaricamento", () => {
    configured()
    setOptedOut(true)

    expect(isOptedOut()).to.equal(true)
    expect(analyticsAllowed()).to.equal(false)
  })

  it('si possono riattivare dopo averle spente', () => {
    configured()
    setOptedOut(true)
    setOptedOut(false)

    expect(isOptedOut()).to.equal(false)
    expect(analyticsAllowed()).to.equal(true)
  })

  it('il Do Not Track del browser vince sulla configurazione', () => {
    configured()
    vi.stubGlobal('navigator', { doNotTrack: '1' })

    expect(analyticsAllowed()).to.equal(false)
  })
})
