import { ipcMain } from 'electron'
import { BOOKS_API_METHODS, ipcChannel } from '../shared/api'
import type { Books } from './db/books'

export function registerBooksIpc(books: Books): void {
  for (const method of BOOKS_API_METHODS) {
    ipcMain.handle(ipcChannel(method), (_event, ...args: unknown[]) =>
      (books[method] as (...a: unknown[]) => unknown)(...args)
    )
  }
}
