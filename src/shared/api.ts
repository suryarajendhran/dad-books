import type {
  DateRange,
  Group,
  Ledger,
  NewLedger,
  NewVoucher,
  TrialBalance,
  Voucher
} from './types'

/** The API the main process exposes to the renderer over IPC. */
export interface BooksApi {
  listGroups(): Promise<Group[]>
  listLedgers(): Promise<Ledger[]>
  createLedger(input: NewLedger): Promise<Ledger>
  createVoucher(input: NewVoucher): Promise<Voucher>
  listVouchers(range: DateRange): Promise<Voucher[]>
  trialBalance(asOf: string): Promise<TrialBalance>
}

export const BOOKS_API_METHODS = [
  'listGroups',
  'listLedgers',
  'createLedger',
  'createVoucher',
  'listVouchers',
  'trialBalance'
] as const satisfies readonly (keyof BooksApi)[]

export const ipcChannel = (method: keyof BooksApi): string => `books:${method}`
