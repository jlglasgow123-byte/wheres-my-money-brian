import type { BankParser } from './types'
import bankwestParser from './bankwest'
import commbankParser from './commbank'
import anzParser from './anz'
import nabParser from './nab'
import macquarieParser from './macquarie'

const parsers: Record<string, BankParser> = {
  bankwest: bankwestParser,
  commbank: commbankParser,
  anz: anzParser,
  nab: nabParser,
  macquarie: macquarieParser,
}

export function getParser(bankId: string): BankParser | null {
  return parsers[bankId] ?? null
}

export function getAvailableBanks(): Array<{ bankId: string; displayName: string }> {
  return Object.values(parsers).map(p => ({
    bankId: p.bankId,
    displayName: p.displayName,
  }))
}
