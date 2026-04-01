import Papa from 'papaparse'
import type { BankParser, ParseResult, RawTransaction } from './types'

// NAB CSV format (with headers):
// Date, Amount, Account Number, Transaction Type, Transaction Details, Balance
// Date format: DD-MM-YYYY (note: dashes not slashes)
// Amount: negative = debit, positive = credit

const EXPECTED_COLUMNS = ['Date', 'Amount', 'Account Number', 'Transaction Type', 'Transaction Details', 'Balance']

function isBlankRow(row: Record<string, string>): boolean {
  return Object.values(row).every(v => !v || v.trim() === '')
}

// NAB uses DD-MM-YYYY — convert to DD/MM/YYYY so the shared normaliser handles it
function normaliseDateFormat(raw: string): string {
  return raw.trim().replace(/-/g, '/')
}

const nabParser: BankParser = {
  bankId: 'nab',
  displayName: 'NAB',
  expectedColumns: EXPECTED_COLUMNS,

  parse(csvContent: string): ParseResult {
    if (!csvContent.trim()) return { ok: false, error: 'empty' }

    const result = Papa.parse<Record<string, string>>(csvContent, {
      header: true,
      skipEmptyLines: 'greedy',
    })

    const headers = result.meta.fields ?? []
    const normalised = headers.map(h => h.toLowerCase().trim())
    const missing = EXPECTED_COLUMNS.filter(col => !normalised.includes(col.toLowerCase()))
    if (missing.length > 0) return { ok: false, error: 'invalid-headers', missing }

    const rows = result.data.filter(row => !isBlankRow(row))
    if (rows.length === 0) return { ok: false, error: 'no-rows' }

    const transactions: RawTransaction[] = rows.map(row => {
      const amount = parseFloat(row['Amount']?.trim() ?? '')
      const debit = !isNaN(amount) && amount < 0 ? String(Math.abs(amount)) : ''
      const credit = !isNaN(amount) && amount >= 0 ? String(amount) : ''
      return {
        rawBsb: '',
        rawAccountNumber: row['Account Number']?.trim() ?? '',
        rawDate: normaliseDateFormat(row['Date'] ?? ''),
        rawNarration: row['Transaction Details']?.trim() ?? '',
        rawCheque: '',
        rawDebit: debit,
        rawCredit: credit,
        rawBalance: row['Balance']?.trim() ?? '',
        rawTransactionType: row['Transaction Type']?.trim() ?? '',
      }
    })

    return { ok: true, rows: transactions }
  },
}

export default nabParser
