// Logica della community condivisa fra app e worker: validazione delle proposte e voti.
import { expect } from 'chai'
import {
  EMPTY_NAME_ERROR,
  FACE_BLUR_REQUIRED_ERROR,
  INVALID_STATURE_RANGE_ERROR,
  INVALID_YOUTUBE_LINK_ERROR,
} from '../../src/domain/exercises'
import {
  DUPLICATE_EXERCISE_ERROR,
  UNKNOWN_EXERCISE_ERROR,
  toggleCommunityVote,
  validateProposal,
  voteCount,
  type CommunityExercise,
} from '../../src/services/communityData'

const now = () => '2026-07-12T10:00:00.000Z'
const newId = () => 'nuovo-id'

function proposal(overrides: Partial<Parameters<typeof validateProposal>[0]> = {}) {
  return {
    name: 'Panca piana',
    description: 'Presa media',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    muscleGroup: 'Petto',
    faceBlurConfirmed: true,
    ...overrides,
  }
}

const catalog: CommunityExercise[] = [
  {
    id: 'ex-1',
    name: 'Stacco da terra',
    description: '',
    youtubeUrl: 'https://youtu.be/AAAAAAAAAAA',
    muscleGroup: 'Schiena',
    faceBlurConfirmed: true,
    createdAt: '2026-07-01T10:00:00.000Z',
  },
]

describe('validateProposal', () => {
  it('normalizza una proposta valida in un esercizio del catalogo', () => {
    expect(validateProposal(proposal(), catalog, now, newId)).to.deep.equal({
      id: 'nuovo-id',
      name: 'Panca piana',
      description: 'Presa media',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      muscleGroup: 'Petto',
      faceBlurConfirmed: true,
      createdAt: '2026-07-12T10:00:00.000Z',
    })
  })

  it('conserva la fascia di statura quando è valida', () => {
    const result = validateProposal(
      proposal({ stature: { minCm: 170, maxCm: 190 } }),
      catalog,
      now,
      newId,
    )
    expect(result.stature).to.deep.equal({ minCm: 170, maxCm: 190 })
  })

  it('rifiuta nome vuoto, link non YouTube, volto non confermato e statura assurda', () => {
    expect(() => validateProposal(proposal({ name: '  ' }), catalog, now, newId)).to.throw(
      EMPTY_NAME_ERROR,
    )
    expect(() =>
      validateProposal(proposal({ youtubeUrl: 'https://vimeo.com/1' }), catalog, now, newId),
    ).to.throw(INVALID_YOUTUBE_LINK_ERROR)
    expect(() =>
      validateProposal(proposal({ faceBlurConfirmed: false }), catalog, now, newId),
    ).to.throw(FACE_BLUR_REQUIRED_ERROR)
    expect(() =>
      validateProposal(proposal({ stature: { minCm: 200, maxCm: 150 } }), catalog, now, newId),
    ).to.throw(INVALID_STATURE_RANGE_ERROR)
  })

  it('rifiuta un video già nel catalogo, anche con un formato di link diverso', () => {
    // Stesso video id dell'esercizio in catalogo, ma link in forma watch?v=
    expect(() =>
      validateProposal(
        proposal({ youtubeUrl: 'https://www.youtube.com/watch?v=AAAAAAAAAAA' }),
        catalog,
        now,
        newId,
      ),
    ).to.throw(DUPLICATE_EXERCISE_ERROR)
  })
})

describe('toggleCommunityVote', () => {
  it('aggiunge il voto una sola volta per dispositivo (idempotente)', () => {
    let votes = toggleCommunityVote({}, 'ex-1', 'hash-a', 'add', catalog)
    votes = toggleCommunityVote(votes, 'ex-1', 'hash-a', 'add', catalog)
    votes = toggleCommunityVote(votes, 'ex-1', 'hash-b', 'add', catalog)

    expect(voteCount(votes, 'ex-1')).to.equal(2)
  })

  it('rimuove solo il voto del dispositivo che lo ritira', () => {
    let votes = toggleCommunityVote({}, 'ex-1', 'hash-a', 'add', catalog)
    votes = toggleCommunityVote(votes, 'ex-1', 'hash-b', 'add', catalog)
    votes = toggleCommunityVote(votes, 'ex-1', 'hash-a', 'remove', catalog)

    expect(votes['ex-1']).to.deep.equal(['hash-b'])
  })

  it('rifiuta il voto su un esercizio che non è in catalogo', () => {
    expect(() => toggleCommunityVote({}, 'fantasma', 'hash-a', 'add', catalog)).to.throw(
      UNKNOWN_EXERCISE_ERROR,
    )
  })

  it('non conta voti per un esercizio mai votato', () => {
    expect(voteCount({}, 'ex-1')).to.equal(0)
  })
})
