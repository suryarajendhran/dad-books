import type { NewVoucher, VoucherLine } from './types'
import { VOUCHER_TYPES } from './types'
import type { Paise } from './money'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function signedAmount(line: VoucherLine): Paise {
  return line.side === 'Dr' ? line.amount : -line.amount
}

export function voucherDifference(lines: VoucherLine[]): Paise {
  return lines.reduce((sum, line) => sum + signedAmount(line), 0)
}

/** Returns a list of problems; an empty list means the voucher can be posted. */
export function validateVoucher(voucher: NewVoucher): string[] {
  const errors: string[] = []

  if (!VOUCHER_TYPES.includes(voucher.type)) {
    errors.push(`Unknown voucher type "${voucher.type}"`)
  }
  if (!ISO_DATE.test(voucher.date) || Number.isNaN(Date.parse(voucher.date))) {
    errors.push('Date must be a valid YYYY-MM-DD date')
  }
  if (voucher.lines.length < 2) {
    errors.push('A voucher needs at least two lines')
  }
  voucher.lines.forEach((line, i) => {
    if (!Number.isSafeInteger(line.amount) || line.amount <= 0) {
      errors.push(`Line ${i + 1}: amount must be greater than zero`)
    }
    if (line.side !== 'Dr' && line.side !== 'Cr') {
      errors.push(`Line ${i + 1}: side must be Dr or Cr`)
    }
  })
  if (!voucher.lines.some((l) => l.side === 'Dr') || !voucher.lines.some((l) => l.side === 'Cr')) {
    errors.push('A voucher needs at least one debit and one credit')
  }
  if (errors.length === 0 && voucherDifference(voucher.lines) !== 0) {
    errors.push('Debits and credits must be equal')
  }

  return errors
}
