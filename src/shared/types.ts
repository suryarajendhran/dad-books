import type { Paise } from './money'

export type Nature = 'asset' | 'liability' | 'income' | 'expense'

export interface Group {
  id: number
  name: string
  parentId: number | null
  nature: Nature
}

export interface Ledger {
  id: number
  name: string
  groupId: number
  /** Signed: positive is a debit balance, negative is a credit balance. */
  openingBalance: Paise
}

export interface NewLedger {
  name: string
  groupId: number
  openingBalance: Paise
}

export const VOUCHER_TYPES = [
  'payment',
  'receipt',
  'contra',
  'journal',
  'sales',
  'purchase'
] as const
export type VoucherType = (typeof VOUCHER_TYPES)[number]

export type Side = 'Dr' | 'Cr'

export interface VoucherLine {
  ledgerId: number
  side: Side
  amount: Paise
}

export interface NewVoucher {
  type: VoucherType
  /** ISO date, YYYY-MM-DD. */
  date: string
  narration: string
  lines: VoucherLine[]
}

export interface Voucher extends NewVoucher {
  id: number
  number: number
}

export interface DateRange {
  from: string
  to: string
}

export interface LedgerBalance {
  ledgerId: number
  name: string
  groupId: number
  groupName: string
  /** Signed closing balance: positive is debit, negative is credit. */
  balance: Paise
}

export interface TrialBalance {
  asOf: string
  rows: LedgerBalance[]
  totalDebit: Paise
  totalCredit: Paise
  /** Non-zero when ledger opening balances don't net to zero. */
  openingDifference: Paise
}
