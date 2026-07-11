import { expect } from 'chai'
import { addDaysIso, todayIso, weekdayNameIt } from '../../src/utils/date'

describe('date locali (YYYY-MM-DD)', () => {
  it('todayIso usa la data locale, non UTC', () => {
    expect(todayIso(new Date(2026, 6, 11, 23, 59))).to.equal('2026-07-11')
  })

  it('addDaysIso attraversa i confini di mese', () => {
    expect(addDaysIso('2026-07-31', 1)).to.equal('2026-08-01')
    expect(addDaysIso('2026-08-01', -1)).to.equal('2026-07-31')
  })

  it('weekdayNameIt dà il giorno della settimana in italiano', () => {
    expect(weekdayNameIt('2026-07-06')).to.equal('Lunedì')
    expect(weekdayNameIt('2026-07-11')).to.equal('Sabato')
    expect(weekdayNameIt('2026-07-12')).to.equal('Domenica')
  })
})
