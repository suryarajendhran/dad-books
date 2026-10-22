import { contextBridge, ipcRenderer } from 'electron'
import { BOOKS_API_METHODS, ipcChannel, type BooksApi } from '../shared/api'

const api = Object.fromEntries(
  BOOKS_API_METHODS.map((method) => [
    method,
    (...args: unknown[]) => ipcRenderer.invoke(ipcChannel(method), ...args)
  ])
) as unknown as BooksApi

contextBridge.exposeInMainWorld('books', api)
