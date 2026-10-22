import type { Nature } from './types'

export interface DefaultGroup {
  name: string
  nature: Nature
  parent?: string
}

/** Predefined account groups, modelled on Tally's default chart of accounts. */
export const DEFAULT_GROUPS: DefaultGroup[] = [
  { name: 'Capital Account', nature: 'liability' },
  { name: 'Reserves & Surplus', nature: 'liability', parent: 'Capital Account' },
  { name: 'Loans (Liability)', nature: 'liability' },
  { name: 'Bank OD A/c', nature: 'liability', parent: 'Loans (Liability)' },
  { name: 'Secured Loans', nature: 'liability', parent: 'Loans (Liability)' },
  { name: 'Unsecured Loans', nature: 'liability', parent: 'Loans (Liability)' },
  { name: 'Current Liabilities', nature: 'liability' },
  { name: 'Duties & Taxes', nature: 'liability', parent: 'Current Liabilities' },
  { name: 'Provisions', nature: 'liability', parent: 'Current Liabilities' },
  { name: 'Sundry Creditors', nature: 'liability', parent: 'Current Liabilities' },
  { name: 'Suspense A/c', nature: 'liability' },
  { name: 'Fixed Assets', nature: 'asset' },
  { name: 'Investments', nature: 'asset' },
  { name: 'Current Assets', nature: 'asset' },
  { name: 'Bank Accounts', nature: 'asset', parent: 'Current Assets' },
  { name: 'Cash-in-Hand', nature: 'asset', parent: 'Current Assets' },
  { name: 'Deposits (Asset)', nature: 'asset', parent: 'Current Assets' },
  { name: 'Loans & Advances (Asset)', nature: 'asset', parent: 'Current Assets' },
  { name: 'Stock-in-Hand', nature: 'asset', parent: 'Current Assets' },
  { name: 'Sundry Debtors', nature: 'asset', parent: 'Current Assets' },
  { name: 'Misc. Expenses (Asset)', nature: 'asset' },
  { name: 'Sales Accounts', nature: 'income' },
  { name: 'Direct Incomes', nature: 'income' },
  { name: 'Indirect Incomes', nature: 'income' },
  { name: 'Purchase Accounts', nature: 'expense' },
  { name: 'Direct Expenses', nature: 'expense' },
  { name: 'Indirect Expenses', nature: 'expense' }
]
