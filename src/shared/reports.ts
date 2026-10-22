import type { LedgerBalance, TrialBalance } from './types'
import type { Paise } from './money'

export function buildTrialBalance(
  asOf: string,
  balances: LedgerBalance[],
  openingDifference: Paise
): TrialBalance {
  const rows = balances.filter((row) => row.balance !== 0)
  let totalDebit = 0
  let totalCredit = 0
  for (const row of rows) {
    if (row.balance > 0) totalDebit += row.balance
    else totalCredit -= row.balance
  }
  return { asOf, rows, totalDebit, totalCredit, openingDifference }
}
