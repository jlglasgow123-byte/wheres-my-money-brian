'use client'

import { useState } from 'react'
import { useRulesStore } from '@/lib/store/rules'
import { useHistoryStore } from '@/lib/store/history'
import { matchesRule } from '@/lib/categoriser/match'
import { DEFAULT_CATEGORIES, getSubcategories } from '@/lib/categories/defaults'
import type { MappingRule, MatchType } from '@/lib/categoriser/types'
import Spinner from '@/components/Spinner'

const MATCH_TYPE_LABELS: Record<MatchType, string> = {
  contains: 'Contains',
  starts_with: 'Starts with',
  ends_with: 'Ends with',
}

type EditingState = {
  id: string
  pattern: string
  matchType: MatchType
  caseSensitive: boolean
  category: string
  subcategory: string | null
  dirty: boolean
}

type NewRuleState = {
  pattern: string
  matchType: MatchType
  caseSensitive: boolean
  category: string
  subcategory: string
}

function MatchBadge({ matchType, caseSensitive }: { matchType?: MatchType; caseSensitive?: boolean }) {
  const mt = matchType ?? 'contains'
  const cs = caseSensitive ?? false
  return (
    <span className="text-xs text-zinc-400 mt-0.5 block">
      {MATCH_TYPE_LABELS[mt]} · {cs ? 'case-sensitive' : 'case-insensitive'}
    </span>
  )
}

function MatchTypeFields({
  matchType,
  caseSensitive,
  onMatchType,
  onCaseSensitive,
}: {
  matchType: MatchType
  caseSensitive: boolean
  onMatchType: (v: MatchType) => void
  onCaseSensitive: (v: boolean) => void
}) {
  return (
    <>
      <div className="flex flex-col gap-1 w-44">
        <label className="text-xs text-zinc-500 font-medium">Match type</label>
        <select
          value={matchType}
          onChange={e => onMatchType(e.target.value as MatchType)}
          className="border border-zinc-300 rounded-lg px-3 py-2 text-sm font-sans text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="contains">Contains</option>
          <option value="starts_with">Starts with</option>
          <option value="ends_with">Ends with</option>
        </select>
      </div>
      <div className="flex flex-col gap-1 justify-end pb-1.5">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={caseSensitive}
            onChange={e => onCaseSensitive(e.target.checked)}
            className="accent-blue-600 w-4 h-4"
          />
          <span className="text-sm text-zinc-600">Case-sensitive</span>
        </label>
      </div>
    </>
  )
}

type RetroPrompt = {
  rule: MappingRule
  matchingIds: string[]
}

export default function RulesPage() {
  const { rules, addRule, updateRule, deleteRule, loaded: rulesLoaded } = useRulesStore()
  const { transactions, bulkUpdateCategory } = useHistoryStore()
  const [editing, setEditing] = useState<EditingState | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newRule, setNewRule] = useState<NewRuleState>({
    pattern: '',
    matchType: 'contains',
    caseSensitive: false,
    category: '',
    subcategory: '',
  })
  const [newRuleError, setNewRuleError] = useState('')
  const [retroPrompt, setRetroPrompt] = useState<RetroPrompt | null>(null)
  const [retroApplying, setRetroApplying] = useState(false)

  if (!rulesLoaded) return <Spinner />

  function checkRetroactive(rule: MappingRule) {
    const matchingIds = transactions
      .filter(tx => matchesRule(tx.narration, rule) && (tx.category !== rule.category || tx.subcategory !== rule.subcategory))
      .map(tx => tx.id!)
      .filter(Boolean)
    if (matchingIds.length > 0) {
      setRetroPrompt({ rule, matchingIds })
    }
  }

  function handleEditStart(rule: MappingRule) {
    setEditing({
      id: rule.id,
      pattern: rule.pattern,
      matchType: rule.matchType ?? 'contains',
      caseSensitive: rule.caseSensitive ?? false,
      category: rule.category,
      subcategory: rule.subcategory,
      dirty: false,
    })
  }

  function handleEditChange<K extends keyof Omit<EditingState, 'id' | 'dirty'>>(field: K, value: EditingState[K]) {
    if (!editing) return
    setEditing(prev => {
      if (!prev) return prev
      const updated = { ...prev, [field]: value, dirty: true }
      if (field === 'category') updated.subcategory = null
      return updated
    })
  }

  function handleEditSave() {
    if (!editing) return
    const updates = {
      pattern: editing.pattern.trim(),
      matchType: editing.matchType,
      caseSensitive: editing.caseSensitive,
      category: editing.category,
      subcategory: editing.subcategory || null,
    }
    updateRule(editing.id, updates)
    const savedRule: MappingRule = { id: editing.id, userMapped: true, ...updates }
    setEditing(null)
    checkRetroactive(savedRule)
  }

  function handleEditCancel() {
    setEditing(null)
  }

  function handleDelete(id: string) {
    if (editing?.id === id) setEditing(null)
    deleteRule(id)
  }

  function handleNewSave() {
    const pattern = newRule.pattern.trim()
    if (!pattern) { setNewRuleError('Pattern is required.'); return }
    if (!newRule.category) { setNewRuleError('Category is required.'); return }
    if (rules.some(r => r.pattern.toLowerCase() === pattern.toLowerCase())) {
      setNewRuleError('A rule with this pattern already exists.')
      return
    }
    const savedRule: MappingRule = {
      id: crypto.randomUUID(),
      pattern,
      matchType: newRule.matchType,
      caseSensitive: newRule.caseSensitive,
      category: newRule.category,
      subcategory: newRule.subcategory || null,
      userMapped: true,
    }
    addRule(savedRule)
    setNewRule({ pattern: '', matchType: 'contains', caseSensitive: false, category: '', subcategory: '' })
    setNewRuleError('')
    setShowNewForm(false)
    checkRetroactive(savedRule)
  }

  const newSubcategories = getSubcategories(newRule.category)

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Rules</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Rules tell Brian how to categorise your transactions automatically.
            </p>
          </div>
          <button
            onClick={() => { setShowNewForm(true); setNewRuleError('') }}
            className="bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add rule
          </button>
        </div>

        {/* New rule form */}
        {showNewForm && (
          <div className="bg-white border border-zinc-200 rounded-xl p-5 mb-6">
            <h2 className="text-sm font-semibold text-zinc-900 mb-4">New rule</h2>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-1 flex-1 min-w-48">
                <label className="text-xs text-zinc-500 font-medium">Pattern</label>
                <input
                  type="text"
                  value={newRule.pattern}
                  onChange={e => setNewRule(p => ({ ...p, pattern: e.target.value }))}
                  placeholder="e.g. Netflix"
                  className="border border-zinc-300 rounded-lg px-3 py-2 text-sm font-sans text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <MatchTypeFields
                matchType={newRule.matchType}
                caseSensitive={newRule.caseSensitive}
                onMatchType={v => setNewRule(p => ({ ...p, matchType: v }))}
                onCaseSensitive={v => setNewRule(p => ({ ...p, caseSensitive: v }))}
              />
              <div className="flex flex-col gap-1 w-44">
                <label className="text-xs text-zinc-500 font-medium">Category</label>
                <select
                  value={newRule.category}
                  onChange={e => setNewRule(p => ({ ...p, category: e.target.value, subcategory: '' }))}
                  className="border border-zinc-300 rounded-lg px-3 py-2 text-sm font-sans text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category</option>
                  {DEFAULT_CATEGORIES.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1 w-44">
                <label className="text-xs text-zinc-500 font-medium">Subcategory</label>
                <select
                  value={newRule.subcategory}
                  onChange={e => setNewRule(p => ({ ...p, subcategory: e.target.value }))}
                  disabled={newSubcategories.length === 0}
                  className="border border-zinc-300 rounded-lg px-3 py-2 text-sm font-sans text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <option value="">No subcategory</option>
                  {newSubcategories.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 items-end">
                <button
                  onClick={handleNewSave}
                  className="bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => { setShowNewForm(false); setNewRuleError('') }}
                  className="border border-zinc-300 text-zinc-600 text-sm font-medium py-2 px-4 rounded-lg hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
            {newRuleError && (
              <p className="mt-3 text-sm text-red-600">{newRuleError}</p>
            )}
          </div>
        )}

        {/* Rules table */}
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-500">
            <span>Pattern</span>
            <span>Category</span>
            <span>Subcategory</span>
            <span></span>
          </div>

          {rules.length === 0 && (
            <p className="px-5 py-10 text-sm text-zinc-400 text-center">
              No rules yet. Add a rule to start auto-categorising transactions.
            </p>
          )}

          {rules.map(rule => {
            const isEditing = editing?.id === rule.id
            const editSubcategories = isEditing ? getSubcategories(editing.category) : []

            return (
              <div key={rule.id} className="border-b border-zinc-100 last:border-0">
                {isEditing ? (
                  <div className="px-5 py-4 space-y-3">
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                      Changes apply to future uploads only. Already imported transactions will not be updated.
                    </p>
                    <div className="flex flex-wrap gap-3 items-end">
                      <div className="flex flex-col gap-1 flex-1 min-w-48">
                        <label className="text-xs text-zinc-500 font-medium">Pattern</label>
                        <input
                          type="text"
                          value={editing.pattern}
                          onChange={e => handleEditChange('pattern', e.target.value)}
                          className="border border-zinc-300 rounded-lg px-3 py-2 text-sm font-sans text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <MatchTypeFields
                        matchType={editing.matchType}
                        caseSensitive={editing.caseSensitive}
                        onMatchType={v => handleEditChange('matchType', v)}
                        onCaseSensitive={v => handleEditChange('caseSensitive', v)}
                      />
                      <div className="flex flex-col gap-1 w-44">
                        <label className="text-xs text-zinc-500 font-medium">Category</label>
                        <select
                          value={editing.category}
                          onChange={e => handleEditChange('category', e.target.value)}
                          className="border border-zinc-300 rounded-lg px-3 py-2 text-sm font-sans text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {DEFAULT_CATEGORIES.map(c => (
                            <option key={c.name} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1 w-44">
                        <label className="text-xs text-zinc-500 font-medium">Subcategory</label>
                        <select
                          value={editing.subcategory ?? ''}
                          onChange={e => handleEditChange('subcategory', e.target.value || null)}
                          disabled={editSubcategories.length === 0}
                          className="border border-zinc-300 rounded-lg px-3 py-2 text-sm font-sans text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <option value="">No subcategory</option>
                          {editSubcategories.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2 items-end">
                        <button
                          onClick={handleEditSave}
                          className="bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleEditCancel}
                          className="border border-zinc-300 text-zinc-600 text-sm font-medium py-2 px-4 rounded-lg hover:bg-zinc-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-center px-5 py-3.5">
                    <span>
                      <span className="text-sm font-mono text-zinc-700">{rule.pattern}</span>
                      <MatchBadge matchType={rule.matchType} caseSensitive={rule.caseSensitive} />
                    </span>
                    <span className="text-sm text-zinc-700">{rule.category}</span>
                    <span className="text-sm text-zinc-500">{rule.subcategory ?? '—'}</span>
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => handleEditStart(rule)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      {/* Retroactive re-categorisation prompt */}
      {retroPrompt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-base font-semibold text-zinc-900 mb-1">Apply to existing transactions?</h2>
            <p className="text-sm text-zinc-500 mb-4">
              {retroPrompt.matchingIds.length} existing transaction{retroPrompt.matchingIds.length !== 1 ? 's' : ''} match this rule but {retroPrompt.matchingIds.length !== 1 ? 'are' : 'is'} categorised differently.
            </p>
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 mb-5 text-sm">
              <p className="font-mono text-zinc-600 text-xs mb-1">{retroPrompt.rule.pattern}</p>
              <p className="text-zinc-900 font-medium">
                {retroPrompt.rule.category}
                {retroPrompt.rule.subcategory && <span className="text-zinc-500 font-normal"> / {retroPrompt.rule.subcategory}</span>}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                disabled={retroApplying}
                onClick={async () => {
                  setRetroApplying(true)
                  await bulkUpdateCategory(retroPrompt.matchingIds, retroPrompt.rule.category, retroPrompt.rule.subcategory)
                  setRetroApplying(false)
                  setRetroPrompt(null)
                }}
                className="w-full bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {retroApplying ? 'Applying…' : `Yes, update ${retroPrompt.matchingIds.length} transaction${retroPrompt.matchingIds.length !== 1 ? 's' : ''}`}
              </button>
              <button
                disabled={retroApplying}
                onClick={() => setRetroPrompt(null)}
                className="w-full border border-zinc-300 text-zinc-600 text-sm font-medium py-2 px-4 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                No, future uploads only
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
