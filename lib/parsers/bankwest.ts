import Papa from 'papaparse'
import type { BankParser, ParseResult, RawTransaction } from './types'

const EXPECTED_COLUMNS = [
  'BSB Number',
  'Account Number',
  'Transaction Date',
  'Narration',
  'Cheque',
  'Debit',
  'Credit',
  'Balance',
  'Transaction Type',
]

function validateHeaders(headers: string[]): { valid: boolean; missing: string[] } {
  const normalised = headers.map(h => h.toLowerCase().trim())
  const missing = EXPECTED_COLUMNS.filter(
    col => !normalised.includes(col.toLowerCase())
  )
  return { valid: missing.length === 0, missing }
}

function isBlankRow(row: Record<string, string>): boolean {
  return Object.values(row).every(v => !v || v.trim() === '')
}

const bankwestParser: BankParser = {
  bankId: 'bankwest',
  displayName: 'Bankwest',
  expectedColumns: EXPECTED_COLUMNS,

  parse(csvContent: string): ParseResult {
    if (!csvContent.trim()) {
      return { ok: false, error: 'empty' }
    }

    const result = Papa.parse<Record<string, string>>(csvContent, {
      header: true,
      skipEmptyLines: 'greedy',
    })

    const headers = result.meta.fields ?? []
    const { valid, missing } = validateHeaders(headers)

    if (!valid) {
      return { ok: false, error: 'invalid-headers', missing }
    }

    const rows: RawTransaction[] = result.data
      .filter(row => !isBlankRow(row))
      .map(row => ({
        rawBsb: row['BSB Number'] ?? '',
        rawAccountNumber: row['Account Number'] ?? '',
        rawDate: row['Transaction Date'] ?? '',
        rawNarration: row['Narration'] ?? '',
        rawCheque: row['Cheque'] ?? '',
        rawDebit: row['Debit'] ?? '',
        rawCredit: row['Credit'] ?? '',
        rawBalance: row['Balance'] ?? '',
        rawTransactionType: row['Transaction Type'] ?? '',
      }))

    if (rows.length === 0) {
      return { ok: false, error: 'no-rows' }
    }

    return { ok: true, rows }
  },
}

export default bankwestParser
