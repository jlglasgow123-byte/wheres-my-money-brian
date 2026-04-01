export interface RawTransaction {
  rawBsb: string
  rawAccountNumber: string
  rawDate: string
  rawNarration: string
  rawCheque: string
  rawDebit: string
  rawCredit: string
  rawBalance: string
  rawTransactionType: string
}

export type ParseResult =
  | { ok: true; rows: RawTransaction[] }
  | { ok: false; error: 'empty' | 'invalid-headers' | 'no-rows'; missing?: string[] }

export interface BankParser {
  bankId: string
  displayName: string
  expectedColumns: string[]
  parse(csvContent: string): ParseResult
}
