import { describe, expect, it } from 'vitest'
import { formatAmount, parseAmount } from './money'

describe('parseAmount', () => {
  it.each([
    ['0', 0],
    ['1', 100],
    ['1.5', 150],
    ['1.05', 105],
    ['1,23,456.78', 12345678],
    [' 2 500 ', 250000],
    ['0.10', 10]
  ])('parses %j as %d paise', (input, expected) => {
    expect(parseAmount(input)).toBe(expected)
  })

  it.each(['', 'abc', '-5', '1.234', '1.', '.5', '1e3'])('rejects %j', (input) => {
    expect(() => parseAmount(input)).toThrow()
  })

  it('avoids floating point drift', () => {
    expect(parseAmount('0.29')).toBe(29)
    expect(parseAmount('1.13')).toBe(113)
  })
})

describe('formatAmount', () => {
  it.each([
    [0, '0.00'],
    [5, '0.05'],
    [150, '1.50'],
    [12345678, '1,23,456.78'],
    [-100000000, '-10,00,000.00']
  ])('formats %d paise as %s', (paise, expected) => {
    expect(formatAmount(paise)).toBe(expected)
  })

  it('round-trips with parseAmount', () => {
    expect(parseAmount(formatAmount(98765432))).toBe(98765432)
  })
})
