/**
 * Amounts are stored as integer paise (1 rupee = 100 paise) to avoid
 * floating point rounding errors.
 */
export type Paise = number

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/

export function parseAmount(input: string): Paise {
  const cleaned = input.replace(/[,\s]/g, '')
  if (!AMOUNT_PATTERN.test(cleaned)) {
    throw new Error(`Invalid amount: "${input}"`)
  }
  const [rupees, fraction = ''] = cleaned.split('.')
  const paise = Number(rupees) * 100 + Number(fraction.padEnd(2, '0'))
  if (!Number.isSafeInteger(paise)) {
    throw new Error(`Amount too large: "${input}"`)
  }
  return paise
}

const rupeeFormatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

export function formatAmount(paise: Paise): string {
  if (!Number.isSafeInteger(paise)) {
    throw new Error(`Invalid paise value: ${paise}`)
  }
  const abs = Math.abs(paise)
  const rupees = rupeeFormatter.format(Math.trunc(abs / 100))
  const fraction = String(abs % 100).padStart(2, '0')
  return `${paise < 0 ? '-' : ''}${rupees}.${fraction}`
}
