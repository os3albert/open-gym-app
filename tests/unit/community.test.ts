// Configurazione della community: quando è accesa e quando no.
// Un URL malformato l'ha già mandata in produzione rotta in silenzio (l'URL del worker era
// senza `https://`, quindi le fetch partivano relative al sito): qui si blinda quel caso.
import { expect } from 'chai'
import { communityApiUrl } from '../../src/services/community'

const WORKER = 'https://open-gym-community.example.workers.dev'

beforeEach(() => {
  vi.unstubAllEnvs()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('URL del worker della community', () => {
  it("senza la variabile d'ambiente la community è spenta", () => {
    expect(communityApiUrl()).to.equal(null)
  })

  it('con un URL assoluto https la community è accesa', () => {
    vi.stubEnv('VITE_COMMUNITY_API_URL', WORKER)
    expect(communityApiUrl()).to.equal(WORKER)
  })

  it("la barra finale non fa parte dell'URL (i percorsi si concatenano)", () => {
    vi.stubEnv('VITE_COMMUNITY_API_URL', `${WORKER}/`)
    expect(communityApiUrl()).to.equal(WORKER)
  })

  it('un URL senza schema NON accende la community: sarebbe una fetch relativa', () => {
    vi.stubEnv('VITE_COMMUNITY_API_URL', 'open-gym-community.example.workers.dev')
    expect(communityApiUrl()).to.equal(null)
  })

  it('uno schema non http(s) viene rifiutato', () => {
    vi.stubEnv('VITE_COMMUNITY_API_URL', 'ftp://open-gym-community.example.workers.dev')
    expect(communityApiUrl()).to.equal(null)
  })
})
