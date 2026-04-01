export type MatchType = 'contains' | 'starts_with' | 'ends_with'

export interface MappingRule {
  id: string
  pattern: string
  matchType?: MatchType      // defaults to 'contains'
  caseSensitive?: boolean    // defaults to false
  category: string
  subcategory: string | null
  userMapped: boolean
}
