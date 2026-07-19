// Le schede proposte alla community: validazione e voti (specchiano quelle degli esercizi).
import { EMPTY_NAME_ERROR, INVALID_YOUTUBE_LINK_ERROR } from '../../src/domain/exercises'
import { EMPTY_DAY_NAME_ERROR, EMPTY_PLAN_NAME_ERROR } from '../../src/domain/plans'
import {
  DUPLICATE_PLAN_ERROR,
  INVALID_PLAN_ERROR,
  PLAN_LIMITS,
  TOO_LONG_ERROR,
  UNKNOWN_PLAN_ERROR,
  togglePlanVote,
  validatePlanProposal,
  type CommunityPlan,
  type CommunityPlanDay,
} from '../../src/services/communityData'

const now = () => '2026-07-19T10:00:00.000Z'
const newId = () => 'plan-1'

function giorno(overrides: Partial<CommunityPlanDay> = {}): CommunityPlanDay {
  return {
    name: 'Lunedì',
    entries: [
      {
        exercise: {
          name: 'Kettlebell swing',
          description: 'Movimento di bacino',
          youtubeUrl: '',
          gifUrl: 'https://raw.githubusercontent.com/example/dataset/abc/gifs/1.gif',
          muscleGroup: 'glutes',
          difficulty: 'medium',
          faceBlurConfirmed: false,
        },
        sets: 4,
        reps: 15,
      },
    ],
    ...overrides,
  }
}

describe('validatePlanProposal', () => {
  it('normalizza una proposta valida con id e data iniettati', () => {
    const plan = validatePlanProposal({ name: '  Full Body  ', days: [giorno()] }, [], now, newId)
    expect(plan).toEqual({
      id: 'plan-1',
      name: 'Full Body',
      createdAt: now(),
      days: [giorno()],
    })
  })

  it('rifiuta nome vuoto, giorni assenti e giorni senza nome con i codici del dominio', () => {
    expect(() => validatePlanProposal({ name: ' ', days: [giorno()] }, [])).toThrowError(
      EMPTY_PLAN_NAME_ERROR,
    )
    expect(() =>
      validatePlanProposal({ name: 'Full Body', days: [] as CommunityPlanDay[] }, []),
    ).toThrowError(INVALID_PLAN_ERROR)
    expect(() =>
      validatePlanProposal({ name: 'Full Body', days: [giorno({ name: '  ' })] }, []),
    ).toThrowError(EMPTY_DAY_NAME_ERROR)
  })

  it('rifiuta più giorni del tetto e una scheda senza nemmeno un esercizio', () => {
    const troppi = Array.from({ length: PLAN_LIMITS.days + 1 }, (_, i) =>
      giorno({ name: `Giorno ${i + 1}` }),
    )
    expect(() => validatePlanProposal({ name: 'Troppi', days: troppi }, [])).toThrowError(
      INVALID_PLAN_ERROR,
    )
    expect(() =>
      validatePlanProposal({ name: 'Vuota', days: [giorno({ entries: [] })] }, []),
    ).toThrowError(INVALID_PLAN_ERROR)
  })

  it('rifiuta serie/ripetizioni non intere positive', () => {
    const day = giorno()
    const rotta = { ...day, entries: [{ ...day.entries[0], sets: 0 }] }
    expect(() => validatePlanProposal({ name: 'Full Body', days: [rotta] }, [])).toThrowError(
      INVALID_PLAN_ERROR,
    )
  })

  it("esige il media dell'esercizio incorporato: link valido o GIF, mai un link scritto male", () => {
    const day = giorno()
    const senzaMedia = {
      ...day,
      entries: [{ ...day.entries[0], exercise: { ...day.entries[0].exercise, gifUrl: undefined } }],
    }
    expect(() => validatePlanProposal({ name: 'Full Body', days: [senzaMedia] }, [])).toThrowError(
      INVALID_YOUTUBE_LINK_ERROR,
    )

    const linkRotto = {
      ...day,
      entries: [
        {
          ...day.entries[0],
          exercise: { ...day.entries[0].exercise, youtubeUrl: 'https://example.com/x' },
        },
      ],
    }
    // La GIF c'è, ma il link scritto e non valido resta rifiutato (stessa regola di M16)
    expect(() => validatePlanProposal({ name: 'Full Body', days: [linkRotto] }, [])).toThrowError(
      INVALID_YOUTUBE_LINK_ERROR,
    )

    const senzaNome = {
      ...day,
      entries: [{ ...day.entries[0], exercise: { ...day.entries[0].exercise, name: '  ' } }],
    }
    expect(() => validatePlanProposal({ name: 'Full Body', days: [senzaNome] }, [])).toThrowError(
      EMPTY_NAME_ERROR,
    )
  })

  it('applica i limiti di lunghezza e il dedup sul nome senza badare alle maiuscole', () => {
    expect(() =>
      validatePlanProposal({ name: 'x'.repeat(PLAN_LIMITS.name + 1), days: [giorno()] }, []),
    ).toThrowError(TOO_LONG_ERROR)

    const esistente = validatePlanProposal({ name: 'Full Body', days: [giorno()] }, [], now, newId)
    expect(() =>
      validatePlanProposal({ name: '  FULL body ', days: [giorno()] }, [esistente]),
    ).toThrowError(DUPLICATE_PLAN_ERROR)
  })
})

describe('togglePlanVote', () => {
  const plans: CommunityPlan[] = [
    validatePlanProposal({ name: 'Full Body', days: [giorno()] }, [], now, newId),
  ]

  it('aggiunge e ritira il voto in modo idempotente', () => {
    const uno = togglePlanVote({}, 'plan-1', 'hash-a', 'add', plans)
    expect(uno).toEqual({ 'plan-1': ['hash-a'] })
    // Idempotente: lo stesso votante non raddoppia
    expect(togglePlanVote(uno, 'plan-1', 'hash-a', 'add', plans)).toEqual(uno)
    expect(togglePlanVote(uno, 'plan-1', 'hash-a', 'remove', plans)).toEqual({ 'plan-1': [] })
  })

  it('rifiuta il voto a una scheda che non è nel catalogo', () => {
    expect(() => togglePlanVote({}, 'sconosciuta', 'hash-a', 'add', plans)).toThrowError(
      UNKNOWN_PLAN_ERROR,
    )
  })
})
