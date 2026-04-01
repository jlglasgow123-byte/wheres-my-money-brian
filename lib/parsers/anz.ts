import Papa from 'papaparse'
import type { BankParser, ParseResult, RawTransaction } from './types'

// ANZ CSV format (no headers — columns by position):
// Date, Amount, Description, Transaction Type, Balance
// Date format: DD/MM/YYYY
// Amount: negative = debit, positive = credit

function isBlankRow(row: string[]): boolean {
  return row.every(v => !v || v.trim() === '')
}

const anzParser: BankParser = {
  bankId: 'anz',
  displayName: 'ANZ',
  expectedColumns: ['Date', 'Amount', 'Description', 'Transaction Type', 'Balance'],

  parse(csvContent: string): ParseResult {
    if (!csvContent.trim()) return { ok: false, error: 'empty' }

    const result = Papa.parse<string[]>(csvContent, {
      header: false,
      skipEmptyLines: 'greedy',
    })

    const rows = result.data.filter(row => !isBlankRow(row))

    if (rows.length === 0) return { ok: false, error: 'no-rows' }

    const first = rows[0]
    if (first.length < 5) return { ok: false, error: 'invalid-headers' }
    if (!/^\d{1,2}\/\d{2}\/\d{4}$/.test(first[0].trim())) {
      return { ok: false, error: 'invalid-headers' }
    }

    const transactions: RawTransaction[] = rows.map(row => {
      const amount = parseFloat(row[1]?.trim() ?? '')
      const debit = !isNaN(amount) && amount < 0 ? String(Math.abs(amount)) : ''
      const credit = !isNaN(amount) && amount >= 0 ? String(amount) : ''
      return {
        rawBsb: '',
        rawAccountNumber: '',
        rawDate: row[0]?.trim() ?? '',
        rawNarration: row[2]?.trim() ?? '',
        rawCheque: '',
        rawDebit: debit,
        rawCredit: credit,
        rawBalance: row[4]?.trim() ?? '',
        rawTransactionType: row[3]?.trim() ?? '',
      }
    })

    return { ok: true, rows: transactions }
  },
}

export default anzParser
