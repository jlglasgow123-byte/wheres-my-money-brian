import type { MappingRule } from './types'

export function matchesRule(narration: string, rule: MappingRule): boolean {
  const matchType = rule.matchType ?? 'contains'
  const caseSensitive = rule.caseSensitive ?? false
  const text = caseSensitive ? narration : narration.toLowerCase()
  const pattern = caseSensitive ? rule.pattern : rule.pattern.toLowerCase()
  switch (matchType) {
    case 'starts_with': return text.startsWith(pattern)
    case 'ends_with': return text.endsWith(pattern)
    default: return text.includes(pattern)
  }
}
