import type { DatabaseSync } from 'node:sqlite'
import type { BooksApi } from '../../shared/api'
import type {
  DateRange,
  Group,
  Ledger,
  LedgerBalance,
  NewLedger,
  NewVoucher,
  TrialBalance,
  Voucher,
  VoucherType
} from '../../shared/types'
import { buildTrialBalance } from '../../shared/reports'
import { signedAmount, validateVoucher } from '../../shared/voucher'

type Sync<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => Promise<infer R> ? (...args: A) => R : never
}

export class Books implements Sync<BooksApi> {
  constructor(private readonly db: DatabaseSync) {}

  listGroups(): Group[] {
    return this.db
      .prepare('SELECT id, name, parent_id AS parentId, nature FROM groups ORDER BY name')
      .all() as unknown as Group[]
  }

  listLedgers(): Ledger[] {
    return this.db
      .prepare(
        'SELECT id, name, group_id AS groupId, opening_balance AS openingBalance FROM ledgers ORDER BY name'
      )
      .all() as unknown as Ledger[]
  }

  createLedger(input: NewLedger): Ledger {
    const name = input.name.trim()
    if (!name) throw new Error('Ledger name is required')
    if (!Number.isSafeInteger(input.openingBalance)) throw new Error('Invalid opening balance')
    if (!this.db.prepare('SELECT 1 FROM groups WHERE id = ?').get(input.groupId)) {
      throw new Error('Unknown group')
    }
    if (this.db.prepare('SELECT 1 FROM ledgers WHERE name = ?').get(name)) {
      throw new Error(`A ledger named "${name}" already exists`)
    }
    const { lastInsertRowid } = this.db
      .prepare('INSERT INTO ledgers (name, group_id, opening_balance) VALUES (?, ?, ?)')
      .run(name, input.groupId, input.openingBalance)
    return {
      id: Number(lastInsertRowid),
      name,
      groupId: input.groupId,
      openingBalance: input.openingBalance
    }
  }

  createVoucher(input: NewVoucher): Voucher {
    const errors = validateVoucher(input)
    if (errors.length > 0) throw new Error(errors.join('; '))

    const ledgerExists = this.db.prepare('SELECT 1 FROM ledgers WHERE id = ?')
    for (const line of input.lines) {
      if (!ledgerExists.get(line.ledgerId)) throw new Error(`Unknown ledger ${line.ledgerId}`)
    }

    return this.transaction(() => {
      const { next } = this.db
        .prepare('SELECT COALESCE(MAX(number), 0) + 1 AS next FROM vouchers WHERE type = ?')
        .get(input.type) as { next: number }
      const narration = input.narration.trim()
      const { lastInsertRowid } = this.db
        .prepare('INSERT INTO vouchers (type, number, date, narration) VALUES (?, ?, ?, ?)')
        .run(input.type, next, input.date, narration)
      const id = Number(lastInsertRowid)
      const insertEntry = this.db.prepare(
        'INSERT INTO voucher_entries (voucher_id, ledger_id, amount) VALUES (?, ?, ?)'
      )
      for (const line of input.lines) insertEntry.run(id, line.ledgerId, signedAmount(line))
      return { ...input, narration, id, number: next }
    })
  }

  listVouchers(range: DateRange): Voucher[] {
    const vouchers = this.db
      .prepare(
        `SELECT id, type, number, date, narration FROM vouchers
         WHERE date BETWEEN ? AND ? ORDER BY date, id`
      )
      .all(range.from, range.to) as unknown as Omit<Voucher, 'lines'>[]
    const entries = this.db.prepare(
      'SELECT ledger_id AS ledgerId, amount FROM voucher_entries WHERE voucher_id = ? ORDER BY id'
    )
    return vouchers.map((voucher) => ({
      ...voucher,
      type: voucher.type as VoucherType,
      lines: (entries.all(voucher.id) as { ledgerId: number; amount: number }[]).map((e) => ({
        ledgerId: e.ledgerId,
        side: e.amount > 0 ? 'Dr' : 'Cr',
        amount: Math.abs(e.amount)
      }))
    }))
  }

  trialBalance(asOf: string): TrialBalance {
    const balances = this.db
      .prepare(
        `SELECT l.id AS ledgerId, l.name, l.group_id AS groupId, g.name AS groupName,
                l.opening_balance + COALESCE((
                  SELECT SUM(e.amount) FROM voucher_entries e
                  JOIN vouchers v ON v.id = e.voucher_id
                  WHERE e.ledger_id = l.id AND v.date <= ?
                ), 0) AS balance
         FROM ledgers l JOIN groups g ON g.id = l.group_id
         ORDER BY g.name, l.name`
      )
      .all(asOf) as unknown as LedgerBalance[]
    const { openingDifference } = this.db
      .prepare('SELECT COALESCE(SUM(opening_balance), 0) AS openingDifference FROM ledgers')
      .get() as { openingDifference: number }
    return buildTrialBalance(asOf, balances, openingDifference)
  }

  private transaction<T>(fn: () => T): T {
    this.db.exec('BEGIN')
    try {
      const result = fn()
      this.db.exec('COMMIT')
      return result
    } catch (error) {
      this.db.exec('ROLLBACK')
      throw error
    }
  }
}
