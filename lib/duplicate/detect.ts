import type { Transaction } from '@/lib/normaliser/types'

export interface DuplicateDetectionResult {
  clean: Transaction[]
  duplicates: Transaction[]
}

function createKey(tx: Transaction): string {
  return `${tx.date}||${tx.narration}||${String(tx.debit)}||${String(tx.credit)}`
}

export function detectDuplicates(
  incoming: Transaction[],
  history: Transaction[]
): DuplicateDetectionResult {
  if (history.length === 0) {
    return { clean: incoming, duplicates: [] }
  }

  const historyKeys = new Set(history.map(createKey))
  const clean: Transaction[] = []
  const duplicates: Transaction[] = []

  for (const tx of incoming) {
    if (historyKeys.has(createKey(tx))) {
      duplicates.push(tx)
    } else {
      clean.push(tx)
    }
  }

  return { clean, duplicates }
}
