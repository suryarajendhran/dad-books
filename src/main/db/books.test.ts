import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_GROUPS } from '../../shared/groups'
import { openDatabase } from './database'
import { Books } from './books'

let books: Books
let groupId: (name: string) => number

beforeEach(() => {
  books = new Books(openDatabase(':memory:'))
  const groups = books.listGroups()
  groupId = (name) => groups.find((g) => g.name === name)!.id
})

describe('Books', () => {
  it('seeds the default chart of accounts', () => {
    const groups = books.listGroups()
    expect(groups).toHaveLength(DEFAULT_GROUPS.length)
    const bank = groups.find((g) => g.name === 'Bank Accounts')!
    expect(bank.parentId).toBe(groupId('Current Assets'))
  })

  it('creates ledgers and rejects duplicates case-insensitively', () => {
    const cash = books.createLedger({
      name: ' Cash ',
      groupId: groupId('Cash-in-Hand'),
      openingBalance: 0
    })
    expect(cash.name).toBe('Cash')
    expect(books.listLedgers()).toEqual([cash])
    expect(() =>
      books.createLedger({ name: 'CASH', groupId: groupId('Cash-in-Hand'), openingBalance: 0 })
    ).toThrow(/already exists/)
  })

  it('posts vouchers with per-type numbering', () => {
    const cash = books.createLedger({
      name: 'Cash',
      groupId: groupId('Cash-in-Hand'),
      openingBalance: 0
    })
    const rent = books.createLedger({
      name: 'Rent',
      groupId: groupId('Indirect Expenses'),
      openingBalance: 0
    })
    const lines = [
      { ledgerId: rent.id, side: 'Dr' as const, amount: 1000 },
      { ledgerId: cash.id, side: 'Cr' as const, amount: 1000 }
    ]
    const first = books.createVoucher({ type: 'payment', date: '2026-04-01', narration: '', lines })
    const second = books.createVoucher({
      type: 'payment',
      date: '2026-04-02',
      narration: '',
      lines
    })
    const journal = books.createVoucher({
      type: 'journal',
      date: '2026-04-02',
      narration: '',
      lines
    })
    expect([first.number, second.number, journal.number]).toEqual([1, 2, 1])

    const listed = books.listVouchers({ from: '2026-04-02', to: '2026-04-30' })
    expect(listed.map((v) => v.id)).toEqual([second.id, journal.id])
    expect(listed[0].lines).toEqual(lines)
  })

  it('does not post invalid vouchers', () => {
    const cash = books.createLedger({
      name: 'Cash',
      groupId: groupId('Cash-in-Hand'),
      openingBalance: 0
    })
    expect(() =>
      books.createVoucher({
        type: 'payment',
        date: '2026-04-01',
        narration: '',
        lines: [
          { ledgerId: cash.id, side: 'Dr', amount: 100 },
          { ledgerId: 999, side: 'Cr', amount: 100 }
        ]
      })
    ).toThrow(/Unknown ledger/)
    expect(books.listVouchers({ from: '2000-01-01', to: '2100-01-01' })).toEqual([])
  })

  it('builds a trial balance as of a date', () => {
    const capital = books.createLedger({
      name: 'Owner Capital',
      groupId: groupId('Capital Account'),
      openingBalance: -5000000
    })
    const bank = books.createLedger({
      name: 'HDFC Bank',
      groupId: groupId('Bank Accounts'),
      openingBalance: 5000000
    })
    const sales = books.createLedger({
      name: 'Sales',
      groupId: groupId('Sales Accounts'),
      openingBalance: 0
    })
    books.createVoucher({
      type: 'receipt',
      date: '2026-04-10',
      narration: 'Invoice 1',
      lines: [
        { ledgerId: bank.id, side: 'Dr', amount: 118000 },
        { ledgerId: sales.id, side: 'Cr', amount: 118000 }
      ]
    })

    const before = books.trialBalance('2026-04-09')
    expect(before.rows.map((r) => r.ledgerId)).not.toContain(sales.id)
    expect(before.totalDebit).toBe(5000000)

    const after = books.trialBalance('2026-04-30')
    expect(after.totalDebit).toBe(5118000)
    expect(after.totalCredit).toBe(5118000)
    expect(after.openingDifference).toBe(0)
    expect(after.rows.find((r) => r.ledgerId === capital.id)?.balance).toBe(-5000000)
  })

  it('reports opening balance differences', () => {
    books.createLedger({ name: 'Cash', groupId: groupId('Cash-in-Hand'), openingBalance: 2500 })
    expect(books.trialBalance('2026-04-01').openingDifference).toBe(2500)
  })
})
