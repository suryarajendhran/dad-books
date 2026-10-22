import type { BooksApi } from '../shared/api'

declare global {
  interface Window {
    books: BooksApi
  }
}
