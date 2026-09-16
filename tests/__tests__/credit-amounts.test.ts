import { creditDecimal, entryFeeBps, feeCents, toCreditCents } from '@/lib/credit-amounts'

describe('Exact credit amounts', () => {
  it.each([['0', 0], ['0.01', 1], [0.29, 29], ['50.00', 5000], ['99999999.99', 9999999999]])(
    'converts %s without binary rounding', (value, cents) => expect(toCreditCents(value)).toBe(cents),
  )
  it.each([NaN, Infinity, -1, 1.001, '1e3', '', null, '9007199254740992'])('rejects %s', value => {
    expect(() => toCreditCents(value)).toThrow()
  })
  it('floors fractional fees and preserves an explicit zero override', () => {
    expect(feeCents(29, 500)).toBe(1)
    expect(feeCents(5000, 500)).toBe(250)
    expect(entryFeeBps('0.00')).toBe(0)
    expect(feeCents(5000, entryFeeBps('0.00'))).toBe(0)
    expect(creditDecimal(-1)).toBe('-0.01')
    expect(creditDecimal(5000)).toBe('50.00')
  })
  it('rejects invalid configured fees', () => {
    const original = process.env.STAKR_ENTRY_FEE_BPS
    try {
      process.env.STAKR_ENTRY_FEE_BPS = '5.5'
      expect(() => entryFeeBps(null)).toThrow()
      process.env.STAKR_ENTRY_FEE_BPS = '750'
      expect(entryFeeBps(null)).toBe(750)
      expect(entryFeeBps('0')).toBe(0)
      expect(() => entryFeeBps('100.01')).toThrow()
    } finally {
      if (original === undefined) delete process.env.STAKR_ENTRY_FEE_BPS
      else process.env.STAKR_ENTRY_FEE_BPS = original
    }
  })
})
