import Papa from 'papaparse'
import type { BankParser, ParseResult, RawTransaction } from './types'

// Macquarie Bank CSV format (with headers):
// Transaction Date, Details, Account, Category, Subcategory, Tags, Notes, Debit, Credit, Balance, Original Description
// Date format: "DD Mon YYYY" e.g. "31 Mar 2026"
// Debit and Credit are separate columns with positive values

const EXPECTED_COLUMNS = ['Transaction Date', 'Details', 'Debit', 'Credit', 'Balance']

const MONTH_MAP: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
}

function parseDate(raw: string): string {
  // "31 Mar 2026" → "31/03/2026"
  const parts = raw.trim().split(' ')
  if (parts.length !== 3) return raw
  const [day, mon, year] = parts
  const month = MONTH_MAP[mon]
  if (!month) return raw
  return `${day.padStart(2, '0')}/${month}/${year}`
}

function isBlankRow(row: Record<string, string>): boolean {
  return Object.values(row).every(v => !v || v.trim() === '')
}

const macquarieParser: BankParser = {
  bankId: 'macquarie',
  displayName: 'Macquarie Bank',
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
      const narration = (row['Original Description']?.trim() || row['Details']?.trim()) ?? ''
      return {
        rawBsb: '',
        rawAccountNumber: row['Account']?.trim() ?? '',
        rawDate: parseDate(row['Transaction Date'] ?? ''),
        rawNarration: narration,
        rawCheque: '',
        rawDebit: row['Debit']?.trim() ?? '',
        rawCredit: row['Credit']?.trim() ?? '',
        rawBalance: row['Balance']?.trim() ?? '',
        rawTransactionType: '',
      }
    })

    return { ok: true, rows: transactions }
  },
}

export default macquarieParser
