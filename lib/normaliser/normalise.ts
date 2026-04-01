import type { RawTransaction } from '@/lib/parsers/types'
import type { MalformedRow, NormaliseResult, Transaction } from './types'

// Parses "D/MM/YYYY" or "DD/MM/YYYY" → "YYYY-MM-DD". Returns error string if invalid.
function parseDate(raw: string): { value: string } | { error: string } {
  const match = raw.trim().match(/^(\d{1,2})\/(\d{2})\/(\d{4})$/)
  if (!match) {
    return { error: `Invalid date format: "${raw}" (expected DD/MM/YYYY)` }
  }
  const [, day, month, year] = match
  const paddedDay = day.padStart(2, '0')
  const date = new Date(`${year}-${month}-${paddedDay}`)
  if (isNaN(date.getTime())) {
    return { error: `Invalid date: "${raw}"` }
  }
  return { value: `${year}-${month}-${paddedDay}` }
}

// Parses a nullable amount field. Empty string → null. "0" → 0. Non-numeric → error.
function parseNullableAmount(raw: string, fieldName: string): { value: number | null } | { error: string } {
  if (raw.trim() === '') return { value: null }
  const n = parseFloat(raw)
  if (isNaN(n)) return { error: `Non-numeric ${fieldName}: "${raw}"` }
  return { value: n }
}

// Parses a required amount field. Empty string or non-numeric → error.
function parseRequiredAmount(raw: string, fieldName: string): { value: number } | { error: string } {
  if (raw.trim() === '') return { error: `Missing ${fieldName}` }
  const n = parseFloat(raw)
  if (isNaN(n)) return { error: `Non-numeric ${fieldName}: "${raw}"` }
  return { value: n }
}

export function normalise(rows: RawTransaction[]): NormaliseResult {
  const transactions: Transaction[] = []
  const malformed: MalformedRow[] = []

  rows.forEach((raw, index) => {
    const rowIndex = index + 1
    const errors: string[] = []

    const dateResult = parseDate(raw.rawDate)
    if ('error' in dateResult) errors.push(dateResult.error)

    const debitResult = parseNullableAmount(raw.rawDebit, 'debit')
    if ('error' in debitResult) errors.push(debitResult.error)

    const creditResult = parseNullableAmount(raw.rawCredit, 'credit')
    if ('error' in creditResult) errors.push(creditResult.error)

    const balanceResult = parseRequiredAmount(raw.rawBalance, 'balance')
    if ('error' in balanceResult) errors.push(balanceResult.error)

    if (errors.length > 0) {
      malformed.push({ raw, rowIndex, errors })
      return
    }

    transactions.push({
      bsb: raw.rawBsb.trim(),
      accountNumber: raw.rawAccountNumber.trim(),
      date: (dateResult as { value: string }).value,
      narration: raw.rawNarration,
      cheque: raw.rawCheque.trim() || null,
      debit: (debitResult as { value: number | null }).value,
      credit: (creditResult as { value: number | null }).value,
      balance: (balanceResult as { value: number }).value,
      transactionType: raw.rawTransactionType.trim(),
      category: 'Uncategorised',
      subcategory: null,
      confidence: null,
      conflict: false,
      uploadSessionId: null,
    })
  })

  return { transactions, malformed }
}
