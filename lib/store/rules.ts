import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import { getUser } from '@/lib/supabase/auth'
import type { MappingRule } from '@/lib/categoriser/types'
import { DEFAULT_RULES } from '@/lib/categoriser/defaultRules'
import { useAuthStore } from '@/lib/store/auth'

interface RulesStore {
  rules: MappingRule[]
  loaded: boolean
  loadRules: () => Promise<void>
  addRule: (rule: MappingRule) => Promise<void>
  updateRule: (id: string, updates: Partial<Omit<MappingRule, 'id'>>) => Promise<void>
  deleteRule: (id: string) => Promise<void>
}

function toRow(rule: MappingRule) {
  return {
    id: rule.id,
    pattern: rule.pattern,
    match_type: rule.matchType ?? 'contains',
    case_sensitive: rule.caseSensitive ?? false,
    category: rule.category,
    subcategory: rule.subcategory,
    user_mapped: rule.userMapped,
  }
}

function fromRow(row: Record<string, unknown>): MappingRule {
  return {
    id: row.id as string,
    pattern: row.pattern as string,
    matchType: ((row.match_type as string) ?? 'contains') as 'contains' | 'starts_with' | 'ends_with',
    caseSensitive: (row.case_sensitive as boolean) ?? false,
    category: row.category as string,
    subcategory: row.subcategory as string | null,
    userMapped: row.user_mapped as boolean,
  }
}

export const useRulesStore = create<RulesStore>((set) => ({
  rules: [...DEFAULT_RULES],
  loaded: false,
  loadRules: async () => {
    if (useAuthStore.getState().isDemoMode) {
      set({ rules: [...DEFAULT_RULES], loaded: true })
      return
    }
    const { data, error } = await supabase
      .from('mapping_rules')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) { console.error('Failed to load rules:', error); return }

    if (!data || data.length === 0) {
      // First run — seed default rules into the database
      const user = await getUser()
      if (user) {
        const rows = DEFAULT_RULES.map(r => ({ ...toRow(r), id: crypto.randomUUID(), user_id: user.id }))
        const { error: insertError } = await supabase.from('mapping_rules').insert(rows)
        if (insertError) console.error('Failed to seed default rules:', insertError)
      }
      set({ rules: [...DEFAULT_RULES], loaded: true })
    } else {
      set({ rules: data.map(fromRow), loaded: true })
    }
  },
  addRule: async (rule) => {
    if (!useAuthStore.getState().isDemoMode) {
      const user = await getUser()
      if (!user) { console.error('Cannot save rule: not authenticated'); return }
      const { error } = await supabase.from('mapping_rules').insert({ ...toRow(rule), user_id: user.id })
      if (error) { console.error('Failed to add rule:', error.message, '|', error.code, '|', error.details); return }
    }
    set(state => ({ rules: [...state.rules, rule] }))
  },
  updateRule: async (id, updates) => {
    if (!useAuthStore.getState().isDemoMode) {
      const dbUpdates: Record<string, unknown> = {}
      if (updates.pattern !== undefined) dbUpdates.pattern = updates.pattern
      if (updates.matchType !== undefined) dbUpdates.match_type = updates.matchType
      if (updates.caseSensitive !== undefined) dbUpdates.case_sensitive = updates.caseSensitive
      if (updates.category !== undefined) dbUpdates.category = updates.category
      if (updates.subcategory !== undefined) dbUpdates.subcategory = updates.subcategory
      if (updates.userMapped !== undefined) dbUpdates.user_mapped = updates.userMapped

      const { error } = await supabase.from('mapping_rules').update(dbUpdates).eq('id', id)
      if (error) { console.error('Failed to update rule:', error); return }
    }
    set(state => ({
      rules: state.rules.map(r => r.id === id ? { ...r, ...updates } : r),
    }))
  },
  deleteRule: async (id) => {
    if (!useAuthStore.getState().isDemoMode) {
      const { error } = await supabase.from('mapping_rules').delete().eq('id', id)
      if (error) { console.error('Failed to delete rule:', error); return }
    }
    set(state => ({ rules: state.rules.filter(r => r.id !== id) }))
  },
}))
