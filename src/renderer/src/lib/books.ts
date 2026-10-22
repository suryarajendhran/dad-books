import type { BooksApi } from '@shared/api'

export const books: BooksApi = window.books

/** Strips Electron's "Error invoking remote method ..." prefix from IPC errors. */
export function errorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.replace(/^Error invoking remote method '[^']+': (Error: )?/, '')
}

export function today(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

/** Start of the Indian financial year (1 April) containing the given ISO date. */
export function financialYearStart(isoDate: string): string {
  const [year, month] = isoDate.split('-').map(Number)
  return `${month >= 4 ? year : year - 1}-04-01`
}
