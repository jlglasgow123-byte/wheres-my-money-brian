import type { RawTransaction } from '@/lib/parsers/types'

export interface MatchedRuleInfo {
  pattern: string
  matchType: 'contains' | 'starts_with' | 'ends_with'
  category: string
  subcategory: string | null
  userMapped: boolean
}

export interface Transaction {
  id?: string                                    // set after saving to DB
  bsb: string
  accountNumber: string
  date: string                              // ISO format: "YYYY-MM-DD"
  narration: string                         // raw string, preserved for export
  cheque: string | null
  debit: number | null                      // null if empty cell
  credit: number | null                     // null if empty cell; 0 if "0"
  balance: number
  transactionType: string
  category: string                          // defaults to "Uncategorised"
  subcategory: string | null                // defaults to null
  confidence: 'High' | 'Medium' | 'Low' | null  // defaults to null; set by Phase 4
  conflict: boolean                             // true when two rules match the same transaction
  matchedRule?: MatchedRuleInfo                 // the rule that produced the category, if any
  uploadSessionId: string | null                // set by Phase 7
  importedAt?: string                           // date-only string e.g. "31 Mar 2026", set from DB created_at
}

export interface MalformedRow {
  raw: RawTransaction
  rowIndex: number    // 1-based
  errors: string[]
}

export interface NormaliseResult {
  transactions: Transaction[]
  malformed: MalformedRow[]
}
