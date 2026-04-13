'use client'

import { useRef, useState } from 'react'
import { useRulesStore } from '@/lib/store/rules'
import { useHistoryStore } from '@/lib/store/history'
import { useUserCategoryStore } from '@/lib/store/userCategories'
import { matchesRule } from '@/lib/categoriser/match'
import { useAllCategories, useGetSubcategories } from '@/lib/categories/useAllCategories'
import { DEFAULT_CATEGORIES } from '@/lib/categories/defaults'
import type { MappingRule, MatchType } from '@/lib/categoriser/types'
import Spinner from '@/components/Spinner'

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

const MATCH_TYPE_LABELS: Record<MatchType, string> = {
  contains: 'Contains',
  starts_with: 'Starts with',
  ends_with: 'Ends with',
}

function MatchBadge({ matchType, caseSensitive }: { matchType?: MatchType; caseSensitive?: boolean }) {
  return (
    <span className="text-xs text-zinc-400 mt-0.5 block">
      {MATCH_TYPE_LABELS[matchType ?? 'contains']} · {caseSensitive ? 'case-sensitive' : 'case-insensitive'}
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

function SubcategoryField({
  category,
  value,
  onChange,
  subcategories,
}: {
  category: string
  value: string
  onChange: (v: string) => void
  subcategories: string[]
}) {
  const { addUserSubcategory } = useUserCategoryStore()
  const [adding, setAdding] = useState(false)
  const [newSubcat, setNewSubcat] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleAdd() {
    const s = newSubcat.trim()
    if (!s || !category) return
    await addUserSubcategory(category, s)
    onChange(s)
    setNewSubcat('')
    setAdding(false)
  }

  return (
    <div className="flex flex-col gap-1 w-44">
      <label className="text-xs text-zinc-500 font-medium">Subcategory</label>
      <div className="flex gap-1">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={!category}
          className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm font-sans text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <option value="">No subcategory</option>
          {subcategories.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {category && (
          <button
            onClick={() => { setAdding(v => !v); setTimeout(() => inputRef.current?.focus(), 50) }}
            title="Add subcategory"
            className="border border-zinc-300 rounded-lg px-2.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors text-base leading-none"
          >
            +
          </button>
        )}
      </div>
      {adding && (
        <div className="flex gap-1">
          <input
            ref={inputRef}
            type="text"
            value={newSubcat}
            onChange={e => setNewSubcat(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setAdding(false); setNewSubcat('') } }}
            placeholder="New subcategory"
            className="flex-1 border border-zinc-300 rounded-lg px-2.5 py-1.5 text-sm font-sans text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={handleAdd} className="border border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 transition-colors">Add</button>
        </div>
      )}
    </div>
  )
}

// Inline add-subcategory used on the Categories tab
function AddSubcatInline({
  categoryName,
  existing,
  onAdd,
}: {
  categoryName: string
  existing: string[]
  onAdd: (name: string) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function toggle() {
    setOpen(v => !v)
    if (!open) setTimeout(() => inputRef.current?.focus(), 50)
  }

  async function handleAdd() {
    const s = value.trim()
    if (!s || existing.includes(s)) return
    await onAdd(s)
    setValue('')
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={toggle}
        className="text-xs text-zinc-400 hover:text-zinc-700 border border-dashed border-zinc-300 rounded-full px-2.5 py-0.5 hover:border-zinc-400 transition-colors"
      >
        + Add subcategory
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        ref={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') handleAdd()
          if (e.key === 'Escape') { setOpen(false); setValue('') }
        }}
        placeholder="New subcategory"
        className="border border-zinc-300 rounded-md px-2 py-0.5 text-xs font-sans text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500 w-36"
      />
      <button onClick={handleAdd} className="text-xs text-blue-600 hover:underline">Add</button>
      <button onClick={() => { setOpen(false); setValue('') }} className="text-xs text-zinc-400 hover:text-zinc-600">Cancel</button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EditingRule = {
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

type CreateCategoryState = {
  name: string
  subcatInput: string
  subcategories: string[]
}

type RetroPrompt = {
  rule: MappingRule
  matchingIds: string[]
}

type ActiveTab = 'categories' | 'rules'

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RulesPage() {
  const { rules, addRule, updateRule, deleteRule, loaded: rulesLoaded } = useRulesStore()
  const { transactions, bulkUpdateCategory } = useHistoryStore()
  const {
    userCategories,
    userSubcategories,
    addUserCategory,
    deleteUserCategory,
    renameUserCategory,
    addUserSubcategory,
    deleteUserSubcategory,
  } = useUserCategoryStore()
  const allCategories = useAllCategories()
  const getSubcategories = useGetSubcategories()

  // Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('categories')

  // Rules tab state
  const [editing, setEditing] = useState<EditingRule | null>(null)
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
  const [searchText, setSearchText] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  // Categories tab — create custom category
  const [showCreateWarning, setShowCreateWarning] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createCategory, setCreateCategory] = useState<CreateCategoryState>({
    name: '', subcatInput: '', subcategories: [],
  })
  const [createCategoryError, setCreateCategoryError] = useState('')

  // Categories tab — rename custom category
  const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null)
  const [editNameValue, setEditNameValue] = useState('')
  const [renameError, setRenameError] = useState('')

  if (!rulesLoaded) return <Spinner />

  // ---------------------------------------------------------------------------
  // Rules helpers
  // ---------------------------------------------------------------------------

  function checkRetroactive(rule: MappingRule) {
    const matchingIds = transactions
      .filter(tx => matchesRule(tx.narration, rule) && (tx.category !== rule.category || tx.subcategory !== rule.subcategory))
      .map(tx => tx.id!)
      .filter(Boolean)
    if (matchingIds.length > 0) setRetroPrompt({ rule, matchingIds })
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

  function handleEditChange<K extends keyof Omit<EditingRule, 'id' | 'dirty'>>(field: K, value: EditingRule[K]) {
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

  const filteredRules = rules.filter(rule => {
    if (filterCategory && rule.category !== filterCategory) return false
    if (searchText) return rule.pattern.toLowerCase().includes(searchText.toLowerCase())
    return true
  })

  // ---------------------------------------------------------------------------
  // Categories helpers
  // ---------------------------------------------------------------------------

  function handleCreateCategoryConfirm() {
    const name = createCategory.name.trim()
    if (!name) { setCreateCategoryError('Category name is required.'); return }
    if (allCategories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      setCreateCategoryError('A category with this name already exists.')
      return
    }
    addUserCategory(name, createCategory.subcategories)
    setCreateCategory({ name: '', subcatInput: '', subcategories: [] })
    setCreateCategoryError('')
    setShowCreateForm(false)
  }

  function handleAddSubcat() {
    const s = createCategory.subcatInput.trim()
    if (!s || createCategory.subcategories.includes(s)) return
    setCreateCategory(p => ({ ...p, subcategories: [...p.subcategories, s], subcatInput: '' }))
  }

  function startRename(name: string) {
    setEditingCategoryName(name)
    setEditNameValue(name)
    setRenameError('')
  }

  async function handleSaveRename() {
    const newName = editNameValue.trim()
    if (!newName || !editingCategoryName) return
    if (newName === editingCategoryName) { setEditingCategoryName(null); return }
    if (allCategories.some(c => c.name.toLowerCase() === newName.toLowerCase())) {
      setRenameError('A category with this name already exists.')
      return
    }
    const oldName = editingCategoryName
    await renameUserCategory(oldName, newName)
    // Update any rules pointing to the old name
    rules
      .filter(r => r.category === oldName)
      .forEach(r => updateRule(r.id, { ...r, category: newName }))
    setEditingCategoryName(null)
    setRenameError('')
  }

  const newSubcategories = getSubcategories(newRule.category)
  const editSubcategories = editing ? getSubcategories(editing.category) : []

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10">
      <div className="max-w-4xl mx-auto">

        {/* Page header + tabs */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Rules & Categories</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Manage how Brian categorises your transactions.
            </p>
            <div className="flex gap-6 mt-4 border-b border-zinc-200">
              {(['categories', 'rules'] as ActiveTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors capitalize ${
                    activeTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  {tab === 'categories' ? 'Categories & Subcategories' : 'Rules'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pb-1">
            {activeTab === 'categories' && (
              <button
                onClick={() => setShowCreateWarning(true)}
                className="bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create category
              </button>
            )}
            {activeTab === 'rules' && (
              <button
                onClick={() => { setShowNewForm(true); setNewRuleError('') }}
                className="bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add rule
              </button>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* TAB 1: Categories & Subcategories                                   */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'categories' && (
          <div className="space-y-6">

            {/* Create category form */}
            {showCreateForm && (
              <div className="bg-white border border-zinc-200 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-zinc-900 mb-1">New category</h2>
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-4">
                  Only create a custom category when none of the existing categories are sufficient.
                </p>
                <div className="flex flex-wrap gap-3 items-end mb-3">
                  <div className="flex flex-col gap-1 flex-1 min-w-48">
                    <label className="text-xs text-zinc-500 font-medium">Category name</label>
                    <input
                      type="text"
                      value={createCategory.name}
                      onChange={e => setCreateCategory(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Side Business"
                      className="border border-zinc-300 rounded-lg px-3 py-2 text-sm font-sans text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1 flex-1 min-w-48">
                    <label className="text-xs text-zinc-500 font-medium">Add subcategory (optional)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={createCategory.subcatInput}
                        onChange={e => setCreateCategory(p => ({ ...p, subcatInput: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleAddSubcat()}
                        placeholder="e.g. Invoices"
                        className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm font-sans text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button onClick={handleAddSubcat} className="border border-zinc-300 text-zinc-600 text-sm font-medium py-2 px-3 rounded-lg hover:bg-zinc-50 transition-colors">
                        Add
                      </button>
                    </div>
                  </div>
                </div>
                {createCategory.subcategories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {createCategory.subcategories.map(s => (
                      <span key={s} className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-700 text-xs font-medium px-2.5 py-1 rounded-full">
                        {s}
                        <button
                          onClick={() => setCreateCategory(p => ({ ...p, subcategories: p.subcategories.filter(x => x !== s) }))}
                          className="text-zinc-400 hover:text-zinc-700 leading-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={handleCreateCategoryConfirm} className="bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                    Save category
                  </button>
                  <button onClick={() => { setShowCreateForm(false); setCreateCategoryError('') }} className="border border-zinc-300 text-zinc-600 text-sm font-medium py-2 px-4 rounded-lg hover:bg-zinc-50 transition-colors">
                    Cancel
                  </button>
                </div>
                {createCategoryError && <p className="mt-3 text-sm text-red-600">{createCategoryError}</p>}
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-zinc-200" />
                System subcategory
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-100 border border-blue-200" />
                You added this
              </div>
            </div>

            {/* Default categories */}
            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Default categories</span>
              </div>
              {DEFAULT_CATEGORIES.map((cat, i) => {
                const userAdded = userSubcategories[cat.name] ?? []
                const allSubs = [...cat.subcategories, ...userAdded]
                return (
                  <div
                    key={cat.name}
                    className={`px-5 py-4 ${i < DEFAULT_CATEGORIES.length - 1 ? 'border-b border-zinc-100' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-zinc-800">{cat.name}</span>
                          <span className="text-[10px] font-medium text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">Default</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {cat.subcategories.map(s => (
                            <span key={s} className="inline-flex items-center text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">
                              {s}
                            </span>
                          ))}
                          {userAdded.map(s => (
                            <span key={s} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                              {s}
                              <button
                                onClick={() => deleteUserSubcategory(cat.name, s)}
                                className="hover:text-blue-900 leading-none ml-0.5"
                                title="Remove"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          <AddSubcatInline
                            categoryName={cat.name}
                            existing={allSubs}
                            onAdd={name => addUserSubcategory(cat.name, name)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Custom categories */}
            {userCategories.length > 0 && (
              <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Custom categories</span>
                </div>
                {userCategories.map((cat, i) => {
                  const userAdded = userSubcategories[cat.name] ?? []
                  const allSubs = [...cat.subcategories, ...userAdded]
                  const isRenaming = editingCategoryName === cat.name
                  return (
                    <div
                      key={cat.name}
                      className={`px-5 py-4 ${i < userCategories.length - 1 ? 'border-b border-zinc-100' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {isRenaming ? (
                              <>
                                <input
                                  value={editNameValue}
                                  onChange={e => { setEditNameValue(e.target.value); setRenameError('') }}
                                  onKeyDown={e => { if (e.key === 'Enter') handleSaveRename(); if (e.key === 'Escape') setEditingCategoryName(null) }}
                                  className="border border-zinc-300 rounded-md px-2 py-0.5 text-sm font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                                  autoFocus
                                />
                                <button onClick={handleSaveRename} className="text-xs text-blue-600 hover:underline">Save</button>
                                <button onClick={() => { setEditingCategoryName(null); setRenameError('') }} className="text-xs text-zinc-400 hover:text-zinc-600">Cancel</button>
                                {renameError && <span className="text-xs text-red-600">{renameError}</span>}
                              </>
                            ) : (
                              <>
                                <span className="text-sm font-semibold text-zinc-800">{cat.name}</span>
                                <span className="text-[10px] font-medium text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">Custom</span>
                                <button
                                  onClick={() => startRename(cat.name)}
                                  className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
                                >
                                  Rename
                                </button>
                              </>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {cat.subcategories.map(s => (
                              <span key={s} className="inline-flex items-center text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">
                                {s}
                              </span>
                            ))}
                            {userAdded.map(s => (
                              <span key={s} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                                {s}
                                <button
                                  onClick={() => deleteUserSubcategory(cat.name, s)}
                                  className="hover:text-blue-900 leading-none ml-0.5"
                                  title="Remove"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                            <AddSubcatInline
                              categoryName={cat.name}
                              existing={allSubs}
                              onAdd={name => addUserSubcategory(cat.name, name)}
                            />
                          </div>
                        </div>
                        {!isRenaming && (
                          <button
                            onClick={() => deleteUserCategory(cat.name)}
                            className="text-xs text-red-500 hover:underline shrink-0 mt-0.5"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 2: Rules                                                         */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'rules' && (
          <div className="space-y-4">

            {/* New rule form */}
            {showNewForm && (
              <div className="bg-white border border-zinc-200 rounded-xl p-5">
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
                      {allCategories.map(c => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <SubcategoryField
                    category={newRule.category}
                    value={newRule.subcategory}
                    onChange={v => setNewRule(p => ({ ...p, subcategory: v }))}
                    subcategories={newSubcategories}
                  />
                  <div className="flex gap-2 items-end">
                    <button onClick={handleNewSave} className="bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                      Save
                    </button>
                    <button onClick={() => { setShowNewForm(false); setNewRuleError('') }} className="border border-zinc-300 text-zinc-600 text-sm font-medium py-2 px-4 rounded-lg hover:bg-zinc-50 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
                {newRuleError && <p className="mt-3 text-sm text-red-600">{newRuleError}</p>}
              </div>
            )}

            {/* Search and filter */}
            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                placeholder="Search by pattern..."
                className="flex-1 min-w-48 border border-zinc-300 rounded-lg px-3 py-2 text-sm font-sans text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="border border-zinc-300 rounded-lg px-3 py-2 text-sm font-sans text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All categories</option>
                {allCategories.map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
              {(searchText || filterCategory) && (
                <button
                  onClick={() => { setSearchText(''); setFilterCategory('') }}
                  className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors px-2"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Rules table */}
            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-500">
                <span>Pattern</span>
                <span>Category</span>
                <span>Subcategory</span>
                <span />
              </div>

              {rules.length === 0 && (
                <p className="px-5 py-10 text-sm text-zinc-400 text-center">
                  No rules yet. Add a rule to start auto-categorising transactions.
                </p>
              )}

              {rules.length > 0 && filteredRules.length === 0 && (
                <p className="px-5 py-10 text-sm text-zinc-400 text-center">
                  No rules match your search.
                </p>
              )}

              {filteredRules.map(rule => {
                const isEditing = editing?.id === rule.id
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
                              {allCategories.map(c => (
                                <option key={c.name} value={c.name}>{c.name}</option>
                              ))}
                            </select>
                          </div>
                          <SubcategoryField
                            category={editing.category}
                            value={editing.subcategory ?? ''}
                            onChange={v => handleEditChange('subcategory', v || null)}
                            subcategories={editSubcategories}
                          />
                          <div className="flex gap-2 items-end">
                            <button onClick={handleEditSave} className="bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                              Save
                            </button>
                            <button onClick={() => setEditing(null)} className="border border-zinc-300 text-zinc-600 text-sm font-medium py-2 px-4 rounded-lg hover:bg-zinc-50 transition-colors">
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
                          <button onClick={() => handleEditStart(rule)} className="text-xs text-blue-600 hover:underline">Edit</button>
                          <button
                            onClick={() => {
                              if (editing?.id === rule.id) setEditing(null)
                              deleteRule(rule.id)
                            }}
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
        )}
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Modals                                                                 */}
      {/* -------------------------------------------------------------------- */}

      {/* Create category — warning gate */}
      {showCreateWarning && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-base font-semibold text-zinc-900 mb-2">Before you create a category</h2>
            <p className="text-sm text-zinc-600 mb-4">
              Brian already includes categories for most common spending. Only create a custom category if none of the existing ones are a reasonable fit.
            </p>
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 mb-5 text-xs text-zinc-500 leading-relaxed">
              Existing: {DEFAULT_CATEGORIES.map(c => c.name).join(' · ')}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowCreateWarning(false); setShowCreateForm(true) }}
                className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
              <button
                onClick={() => setShowCreateWarning(false)}
                className="flex-1 border border-zinc-300 text-zinc-600 text-sm font-medium py-2 px-4 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Retroactive recategorisation */}
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
