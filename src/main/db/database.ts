import { DatabaseSync } from 'node:sqlite'
import { DEFAULT_GROUPS } from '../../shared/groups'

const MIGRATIONS: string[] = [
  `
  CREATE TABLE groups (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    parent_id INTEGER REFERENCES groups(id),
    nature TEXT NOT NULL CHECK (nature IN ('asset', 'liability', 'income', 'expense'))
  );

  CREATE TABLE ledgers (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    group_id INTEGER NOT NULL REFERENCES groups(id),
    opening_balance INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE vouchers (
    id INTEGER PRIMARY KEY,
    type TEXT NOT NULL,
    number INTEGER NOT NULL,
    date TEXT NOT NULL,
    narration TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (type, number)
  );
  CREATE INDEX vouchers_date ON vouchers(date);

  -- amount is signed: positive is debit, negative is credit
  CREATE TABLE voucher_entries (
    id INTEGER PRIMARY KEY,
    voucher_id INTEGER NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
    ledger_id INTEGER NOT NULL REFERENCES ledgers(id),
    amount INTEGER NOT NULL CHECK (amount <> 0)
  );
  CREATE INDEX voucher_entries_voucher ON voucher_entries(voucher_id);
  CREATE INDEX voucher_entries_ledger ON voucher_entries(ledger_id);
  `
]

export function openDatabase(path: string): DatabaseSync {
  const db = new DatabaseSync(path)
  db.exec('PRAGMA foreign_keys = ON')
  if (path !== ':memory:') db.exec('PRAGMA journal_mode = WAL')
  migrate(db)
  return db
}

function migrate(db: DatabaseSync): void {
  const { user_version: current } = db.prepare('PRAGMA user_version').get() as {
    user_version: number
  }
  for (let version = current; version < MIGRATIONS.length; version++) {
    db.exec('BEGIN')
    try {
      db.exec(MIGRATIONS[version])
      if (version === 0) seedGroups(db)
      db.exec(`PRAGMA user_version = ${version + 1}`)
      db.exec('COMMIT')
    } catch (error) {
      db.exec('ROLLBACK')
      throw error
    }
  }
}

function seedGroups(db: DatabaseSync): void {
  const insert = db.prepare('INSERT INTO groups (name, parent_id, nature) VALUES (?, ?, ?)')
  const ids = new Map<string, number>()
  for (const group of DEFAULT_GROUPS) {
    const parentId = group.parent ? ids.get(group.parent) : undefined
    if (group.parent && parentId === undefined) {
      throw new Error(`Group "${group.name}" listed before its parent "${group.parent}"`)
    }
    const { lastInsertRowid } = insert.run(group.name, parentId ?? null, group.nature)
    ids.set(group.name, Number(lastInsertRowid))
  }
}
