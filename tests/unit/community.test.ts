// Configurazione della community: quando è accesa e quando no.
// Un URL malformato l'ha già mandata in produzione rotta in silenzio (l'URL del worker era
// senza `https://`, quindi le fetch partivano relative al sito): qui si blinda quel caso.
import { expect } from 'chai'
import type { Exercise } from '../../src/domain/types'
import { communityApiUrl, mergeForDisplay } from '../../src/services/community'
import type { CommunityExercise } from '../../src/services/communityData'

const WORKER = 'https://open-gym-community.example.workers.dev'

const VIDEO = 'https://youtu.be/dQw4w9WgXcQ'

const locale: Exercise = {
  id: 'ex-locale',
  name: 'Panca piana',
  description: '',
  youtubeUrl: VIDEO,
  muscleGroup: 'Petto',
  difficulty: 'medium',
  faceBlurConfirmed: true,
  votes: 0,
  createdAt: '2026-07-13T10:00:00.000Z',
}

const condiviso: CommunityExercise = {
  id: 'ex-community',
  name: 'Panca piana',
  description: '',
  // Stesso video, scritto in un'altra forma: il dedup guarda il video id, non la stringa
  youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  muscleGroup: 'Petto',
  difficulty: 'medium',
  faceBlurConfirmed: true,
  createdAt: '2026-07-13T11:00:00.000Z',
}

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

describe('lista unita locale + community', () => {
  it('sullo stesso video vince la community: un solo esercizio, con il suo id', () => {
    const merged = mergeForDisplay([locale], [condiviso], { 'ex-community': 5 })

    expect(merged).to.have.lengthOf(1)
    expect(merged[0].id).to.equal('ex-community')
    expect(merged[0].fromCommunity).to.equal(true)
    // Il conteggio è quello del repo, non il campo `votes` della copia locale
    expect(merged[0].votes).to.equal(5)
  })

  it('un esercizio solo mio resta mio, e resta modificabile', () => {
    const soloMio = { ...locale, id: 'ex-mio', youtubeUrl: 'https://youtu.be/AAAAAAAAAAA' }

    const merged = mergeForDisplay([soloMio], [condiviso], {})

    expect(merged).to.have.lengthOf(2)
    expect(merged[0].id).to.equal('ex-mio')
    expect(merged[0].fromCommunity).to.equal(undefined)
  })

  it('senza catalogo della community restano solo i miei', () => {
    expect(mergeForDisplay([locale], [], {})).to.have.lengthOf(1)
  })
})
