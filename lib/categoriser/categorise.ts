import type { Transaction } from '@/lib/normaliser/types'
import type { MappingRule } from './types'
import { matchesRule } from './match'

function isBoundary(char: string): boolean {
  return char === '' || !/[a-zA-Z0-9]/.test(char)
}

function scoreConfidence(
  pattern: string,
  narration: string,
  rule: MappingRule
): 'High' | 'Medium' | 'Low' {
  if (rule.userMapped) return 'High'

  const matchType = rule.matchType ?? 'contains'
  // Anchored matches are always High — the position is unambiguous
  if (matchType === 'starts_with' || matchType === 'ends_with') return 'High'

  const caseSensitive = rule.caseSensitive ?? false
  const text = caseSensitive ? narration : narration.toLowerCase()
  const pat = caseSensitive ? pattern : pattern.toLowerCase()
  const idx = text.indexOf(pat)

  const charBefore = idx === 0 ? '' : text[idx - 1]
  const charAfter = idx + pat.length >= text.length ? '' : text[idx + pat.length]

  const leftBound = isBoundary(charBefore)
  const rightBound = isBoundary(charAfter)

  if (leftBound && rightBound) return 'High'
  if (leftBound) return 'Medium'
  return 'Low'
}

export function categorise(transactions: Transaction[], rules: MappingRule[]): Transaction[] {
  if (rules.length === 0) return transactions

  return transactions.map(tx => {
    const matches = rules.filter(rule => matchesRule(tx.narration, rule))

    if (matches.length === 0) return tx

    if (matches.length > 1) {
      const deduplicated = matches.filter(rule =>
        !matches.some(
          other => other !== rule && other.pattern.toLowerCase().includes(rule.pattern.toLowerCase())
        )
      )

      const candidates = deduplicated.length >= 1 ? deduplicated : matches

      const allSameCategory = candidates.every(r => r.category === candidates[0].category)
      const allSameSubcategory = candidates.every(r => r.subcategory === candidates[0].subcategory)

      if (allSameCategory && allSameSubcategory) {
        const best = candidates.reduce((a, b) =>
          b.pattern.length > a.pattern.length ? b : a
        )
        return {
          ...tx,
          category: best.category,
          subcategory: best.subcategory,
          confidence: scoreConfidence(best.pattern, tx.narration, best),
          conflict: false,
        }
      }

      return { ...tx, conflict: true }
    }

    const rule = matches[0]
    return {
      ...tx,
      category: rule.category,
      subcategory: rule.subcategory,
      confidence: scoreConfidence(rule.pattern, tx.narration, rule),
      conflict: false,
    }
  })
}
