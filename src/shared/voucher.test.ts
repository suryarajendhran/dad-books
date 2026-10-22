import { describe, expect, it } from 'vitest'
import type { NewVoucher } from './types'
import { validateVoucher, voucherDifference } from './voucher'

const valid: NewVoucher = {
  type: 'payment',
  date: '2026-04-01',
  narration: 'Rent for April',
  lines: [
    { ledgerId: 1, side: 'Dr', amount: 2500000 },
    { ledgerId: 2, side: 'Cr', amount: 2500000 }
  ]
}

describe('validateVoucher', () => {
  it('accepts a balanced voucher', () => {
    expect(validateVoucher(valid)).toEqual([])
  })

  it('accepts multi-line vouchers that balance', () => {
    expect(
      validateVoucher({
        ...valid,
        lines: [
          { ledgerId: 1, side: 'Dr', amount: 1000 },
          { ledgerId: 2, side: 'Dr', amount: 180 },
          { ledgerId: 3, side: 'Cr', amount: 1180 }
        ]
      })
    ).toEqual([])
  })

  it('rejects unbalanced vouchers', () => {
    expect(
      validateVoucher({ ...valid, lines: [valid.lines[0], { ...valid.lines[1], amount: 1 }] })
    ).toContain('Debits and credits must be equal')
  })

  it('rejects single-sided vouchers', () => {
    expect(
      validateVoucher({ ...valid, lines: [valid.lines[0], { ...valid.lines[0], ledgerId: 2 }] })
    ).toContain('A voucher needs at least one debit and one credit')
  })

  it('rejects zero, negative and fractional amounts', () => {
    for (const amount of [0, -100, 1.5]) {
      const errors = validateVoucher({
        ...valid,
        lines: [{ ...valid.lines[0], amount }, valid.lines[1]]
      })
      expect(errors).toContain('Line 1: amount must be greater than zero')
    }
  })

  it('rejects bad dates and too few lines', () => {
    const errors = validateVoucher({ ...valid, date: '01/04/2026', lines: [valid.lines[0]] })
    expect(errors).toContain('Date must be a valid YYYY-MM-DD date')
    expect(errors).toContain('A voucher needs at least two lines')
  })
})

describe('voucherDifference', () => {
  it('is debit minus credit', () => {
    expect(voucherDifference([{ ledgerId: 1, side: 'Dr', amount: 500 }])).toBe(500)
    expect(voucherDifference(valid.lines)).toBe(0)
  })
})
