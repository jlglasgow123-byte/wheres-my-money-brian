'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useHistoryStore } from '@/lib/store/history'
import { useRulesStore } from '@/lib/store/rules'
import { useAllCategories, useGetSubcategories } from '@/lib/categories/useAllCategories'
import type { MatchType, MappingRule } from '@/lib/categoriser/types'
import { matchesRule } from '@/lib/categoriser/match'
import Spinner from '@/components/Spinner'

const PAGE_SIZE = 50

const MATCH_LABELS: Record<MatchType, string> = {
  contains: 'Contains',
  starts_with: 'Starts with',
  ends_with: 'Ends with',
}

function fmt(n: number) {
  return n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })
}

// ALL_CATEGORY_NAMES is now derived inside the component via useAllCategories()

function escapeCell(value: string | number | null | undefined): string {
  const s = value == null ? '' : String(value)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function buildCsv(rows: import('@/lib/normaliser/types').Transaction[]): string {
  const header = ['Transaction Date', 'Imported', 'Description', 'Debit', 'Credit', 'Category', 'Subcategory']
  const lines = [header.join(',')]
  for (const tx of rows) {
    lines.push([
      escapeCell(tx.date),
      escapeCell(tx.importedAt ?? ''),
      escapeCell(tx.narration),
      escapeCell(tx.debit ?? ''),
      escapeCell(tx.credit ?? ''),
      escapeCell(tx.category),
      escapeCell(tx.subcategory ?? ''),
    ].join(','))
  }
  return lines.join('\r\n')
}

export default function TransactionsPage() {
  const { transactions, deleteTransaction, updateTransaction, bulkUpdateCategory, loaded: historyLoaded } = useHistoryStore()
  const { rules, addRule, deleteRule } = useRulesStore()
  const allCategories = useAllCategories()
  const getSubcategories = useGetSubcategories()
  const ALL_CATEGORY_NAMES = allCategories.map(c => c.name)

  // Display filters
  const [typeFilter, setTypeFilter] = useState('Income and Spending')
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const categoryDropdownRef = useRef<HTMLDivElement>(null)

  // Search filters
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [importDateFrom, setImportDateFrom] = useState('')
  const [importDateTo, setImportDateTo] = useState('')
  const [amountMin, setAmountMin] = useState('')
  const [amountMax, setAmountMax] = useState('')

  const [page, setPage] = useState(1)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false)
  const [duplicateGroups, setDuplicateGroups] = useState<import('@/lib/normaliser/types').Transaction[][] | null>(null)
  const [duplicatesToDelete, setDuplicatesToDelete] = useState<Set<string>>(new Set())

  // Bulk edit
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkCategory, setBulkCategory] = useState('')
  const [bulkSubcategory, setBulkSubcategory] = useState('')

  const [rulePrompt, setRulePrompt] = useState<{ id: string; narration: string; pattern: string; category: string; subcategory: string | null } | null>(null)
  const [ruleMatchType, setRuleMatchType] = useState<MatchType>('contains')
  const [ruleMatchCase, setRuleMatchCase] = useState(false)
  const [retroPrompt, setRetroPrompt] = useState<{ matchingIds: string[]; category: string; subcategory: string | null } | null>(null)
  const [retroApplying, setRetroApplying] = useState(false)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const categories = useMemo(() => {
    return Array.from(new Set(transactions.map(tx => tx.category).filter(Boolean))).sort()
  }, [transactions])

  const filtered = useMemo(() => {
    let result = transactions

    if (typeFilter === 'Spending') result = result.filter(tx => tx.debit != null)
    if (typeFilter === 'Income') result = result.filter(tx => tx.credit != null)

    if (selectedCategories.size > 0) result = result.filter(tx => selectedCategories.has(tx.category))

    if (search) result = result.filter(tx => tx.narration.toLowerCase().includes(search.toLowerCase()))

    if (dateFrom) result = result.filter(tx => tx.date >= dateFrom)
    if (dateTo) result = result.filter(tx => tx.date <= dateTo)

    if (importDateFrom) result = result.filter(tx => tx.importedAt && tx.importedAt >= importDateFrom)
    if (importDateTo) result = result.filter(tx => tx.importedAt && tx.importedAt <= importDateTo)

    if (amountMin !== '') {
      const min = parseFloat(amountMin)
      result = result.filter(tx => (tx.debit ?? tx.credit ?? 0) >= min)
    }
    if (amountMax !== '') {
      const max = parseFloat(amountMax)
      result = result.filter(tx => (tx.debit ?? tx.credit ?? 0) <= max)
    }

    return result
  }, [transactions, typeFilter, selectedCategories, search, dateFrom, dateTo, importDateFrom, importDateTo, amountMin, amountMax])

  const totalDebit = filtered.reduce((sum, tx) => sum + (tx.debit ?? 0), 0)
  const totalCredit = filtered.reduce((sum, tx) => sum + (tx.credit ?? 0), 0)

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function toggleCategory(cat: string) {
    setSelectedCategories(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
    setPage(1)
  }

  function clearCategories() {
    setSelectedCategories(new Set())
    setPage(1)
  }

  function selectAllCategories() {
    setSelectedCategories(new Set(categories))
    setPage(1)
  }

  const categoryLabel = selectedCategories.size === 0
    ? 'All Categories'
    : selectedCategories.size === 1
      ? Array.from(selectedCategories)[0]
      : `${selectedCategories.size} categories`

  async function handleDelete() {
    if (!pendingDelete) return
    await deleteTransaction(pendingDelete)
    setPendingDelete(null)
  }

  function exportCsv() {
    const csv = buildCsv(filtered)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const today = new Date().toISOString().slice(0, 10)
    const from = dateFrom || (filtered.length > 0 ? filtered[filtered.length - 1].date : '')
    const to = dateTo || (filtered.length > 0 ? filtered[0].date : '')
    const suffix = from && to && from !== to ? `${from}_${to}` : today
    a.href = url
    a.download = `brian-transactions-${suffix}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleSaveRule() {
    if (!rulePrompt) return
    const pattern = rulePrompt.pattern.trim() || rulePrompt.narration
    const savedRule: MappingRule = {
      id: crypto.randomUUID(),
      pattern,
      matchType: ruleMatchType,
      caseSensitive: ruleMatchCase,
      category: rulePrompt.category,
      subcategory: rulePrompt.subcategory,
      userMapped: true,
    }
    const existing = rules.find(r => r.pattern.toLowerCase() === pattern.toLowerCase())
    if (existing) {
      const { updateRule } = useRulesStore.getState()
      await updateRule(existing.id, {
        pattern,
        category: rulePrompt.category,
        subcategory: rulePrompt.subcategory,
        matchType: ruleMatchType,
        caseSensitive: ruleMatchCase,
        userMapped: true,
      })
    } else {
      await addRule(savedRule)
    }

    // Find transactions that match this rule but have a different category (exclude the one just edited)
    const matchingIds = transactions
      .filter(tx => tx.id !== rulePrompt.id && matchesRule(tx.narration, savedRule) && (tx.category !== savedRule.category || tx.subcategory !== savedRule.subcategory))
      .map(tx => tx.id!)
      .filter(Boolean)

    setRulePrompt(null)
    setRuleMatchType('contains')
    setRuleMatchCase(false)

    if (matchingIds.length > 0) {
      setRetroPrompt({ matchingIds, category: savedRule.category, subcategory: savedRule.subcategory })
    }
  }

  const allFilteredIds = useMemo(() => filtered.map(tx => tx.id).filter(Boolean) as string[], [filtered])
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedIds.has(id))
  const bulkSubcatOptions = getSubcategories(bulkCategory)

  async function handleBulkDelete() {
    await Promise.all(Array.from(selectedIds).map(id => deleteTransaction(id)))
    setSelectedIds(new Set())
    setPendingBulkDelete(false)
  }

  async function applyBulkEdit() {
    if (!bulkCategory || selectedIds.size === 0) return
    const sub = bulkSubcategory || null
    await Promise.all(Array.from(selectedIds).map(id => updateTransaction(id, bulkCategory, sub)))
    setSelectedIds(new Set())
    setBulkCategory('')
    setBulkSubcategory('')
  }

  function toggleSelectId(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(allFilteredIds))
    }
  }

  function findDuplicates() {
    const groups = new Map<string, import('@/lib/normaliser/types').Transaction[]>()
    for (const tx of transactions) {
      const key = `${tx.date}|${tx.narration.toLowerCase().trim()}|${tx.debit ?? tx.credit ?? 0}`
      const group = groups.get(key) ?? []
      group.push(tx)
      groups.set(key, group)
    }
    const dupes = Array.from(groups.values()).filter(g => g.length > 1)
    // Default: mark all but the earliest-imported as duplicates
    const toDelete = new Set<string>()
    for (const group of dupes) {
      const sorted = [...group].sort((a, b) => (a.importedAt ?? '') < (b.importedAt ?? '') ? -1 : 1)
      sorted.slice(1).forEach(tx => { if (tx.id) toDelete.add(tx.id) })
    }
    setDuplicateGroups(dupes)
    setDuplicatesToDelete(toDelete)
  }

  async function deleteDuplicates() {
    await Promise.all(Array.from(duplicatesToDelete).map(id => deleteTransaction(id)))
    setDuplicateGroups(null)
    setDuplicatesToDelete(new Set())
  }

  if (!historyLoaded) return <Spinner />

  return (
    <main className="min-h-screen bg-zinc-50">
      {/* Upload bar */}
      <div className="bg-white border-b border-zinc-200 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} saved
          </p>
          <div className="flex items-center gap-3">
            {transactions.length > 0 && (
              <button
                onClick={findDuplicates}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-zinc-300 text-zinc-600 bg-white hover:bg-zinc-50 transition-colors"
              >
                Find duplicates
              </button>
            )}
            {filtered.length > 0 && (
              <button
                onClick={exportCsv}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-zinc-300 text-zinc-600 bg-white hover:bg-zinc-50 transition-colors"
              >
                Export CSV
              </button>
            )}
            <Link
              href="/"
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: '#399605' }}
            >
              + Upload transactions
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-xl font-semibold text-zinc-900 mb-6">Transactions</h1>

        {/* Filter panel */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* DISPLAY */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Display</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center text-sm text-zinc-600 w-36 shrink-0">
                  Transaction type
                  <span title="Filter to show only spending (debits), only income (credits), or both." className="ml-1 relative -top-1.5 inline-flex items-center justify-center w-3 h-3 rounded-full bg-zinc-100 text-zinc-400 text-[9px] cursor-help shrink-0">?</span>
                </span>
                <select
                  value={typeFilter}
                  onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
                  className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-600"
                >
                  <option>Income and Spending</option>
                  <option>Spending</option>
                  <option>Income</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center text-sm text-zinc-600 w-36 shrink-0">
                  Category
                  <span title="Filter by one or more spending categories. Select all to show every category." className="ml-1 relative -top-1.5 inline-flex items-center justify-center w-3 h-3 rounded-full bg-zinc-100 text-zinc-400 text-[9px] cursor-help shrink-0">?</span>
                </span>
                <div ref={categoryDropdownRef} className="relative flex-1">
                  <button
                    onClick={() => setCategoryDropdownOpen(o => !o)}
                    className="w-full flex items-center gap-2 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 bg-white hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-green-600"
                  >
                    <span className="flex-1 text-left truncate">{categoryLabel}</span>
                    <span className="text-zinc-400 shrink-0">▾</span>
                  </button>
                  {categoryDropdownOpen && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-zinc-200 rounded-xl shadow-lg py-1">
                      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-100">
                        <span className="text-xs font-medium text-zinc-500">Categories</span>
                        {selectedCategories.size === categories.length
                          ? <button onClick={clearCategories} className="text-xs text-zinc-400 hover:text-zinc-700">Clear selection</button>
                          : <button onClick={selectAllCategories} className="text-xs text-zinc-400 hover:text-zinc-700">Select all</button>
                        }
                      </div>
                      <div className="max-h-52 overflow-y-auto">
                        {categories.map(cat => (
                          <label key={cat} className="flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedCategories.has(cat)}
                              onChange={() => toggleCategory(cat)}
                              className="accent-green-600"
                            />
                            <span className="text-sm text-zinc-800">{cat}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SEARCH */}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Search</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center text-sm text-zinc-600 w-32 shrink-0">
                  Description
                  <span title="Search by transaction description or merchant name. Partial matches are supported." className="ml-1 relative -top-1.5 inline-flex items-center justify-center w-3 h-3 rounded-full bg-zinc-100 text-zinc-400 text-[9px] cursor-help shrink-0">?</span>
                </span>
                <input
                  type="text"
                  placeholder="Search…"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                  className="flex-1 min-w-0 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center text-sm text-zinc-600 w-32 shrink-0">
                  Transaction date
                  <span title="Filter by the date the transaction occurred on your bank statement." className="ml-1 relative -top-1.5 inline-flex items-center justify-center w-3 h-3 rounded-full bg-zinc-100 text-zinc-400 text-[9px] cursor-help shrink-0">?</span>
                </span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => { setDateFrom(e.target.value); setPage(1) }}
                  className="flex-1 min-w-0 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-green-600"
                />
                <span className="text-xs text-zinc-400 shrink-0">to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => { setDateTo(e.target.value); setPage(1) }}
                  className="flex-1 min-w-0 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center text-sm text-zinc-600 w-32 shrink-0">
                  Import date
                  <span title="Filter by the date you uploaded this batch of transactions into Brian." className="ml-1 relative -top-1.5 inline-flex items-center justify-center w-3 h-3 rounded-full bg-zinc-100 text-zinc-400 text-[9px] cursor-help shrink-0">?</span>
                </span>
                <input
                  type="date"
                  value={importDateFrom}
                  onChange={e => { setImportDateFrom(e.target.value); setPage(1) }}
                  className="flex-1 min-w-0 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-green-600"
                />
                <span className="text-xs text-zinc-400 shrink-0">to</span>
                <input
                  type="date"
                  value={importDateTo}
                  onChange={e => { setImportDateTo(e.target.value); setPage(1) }}
                  className="flex-1 min-w-0 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center text-sm text-zinc-600 w-32 shrink-0">
                  Amount
                  <span title="Filter by transaction amount. Applies to both debits and credits." className="ml-1 relative -top-1.5 inline-flex items-center justify-center w-3 h-3 rounded-full bg-zinc-100 text-zinc-400 text-[9px] cursor-help shrink-0">?</span>
                </span>
                <input
                  type="number"
                  placeholder="Min"
                  value={amountMin}
                  min="0"
                  onChange={e => { setAmountMin(e.target.value); setPage(1) }}
                  className="flex-1 min-w-0 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-green-600"
                />
                <span className="text-xs text-zinc-400 shrink-0">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={amountMax}
                  min="0"
                  onChange={e => { setAmountMax(e.target.value); setPage(1) }}
                  className="flex-1 min-w-0 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
            </div>
          </div>

          {/* Reset — spans both columns */}
          <div className="md:col-span-2 flex justify-end pt-2 border-t border-zinc-100">
            <button
              onClick={() => {
                setTypeFilter('Income and Spending')
                setSelectedCategories(new Set())
                setSearch('')
                setDateFrom('')
                setDateTo('')
                setImportDateFrom('')
                setImportDateTo('')
                setAmountMin('')
                setAmountMax('')
                setPage(1)
              }}
              className="px-4 py-1.5 rounded-lg text-sm font-medium border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-300 transition-colors"
            >
              Reset filters
            </button>
          </div>
        </div>

        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <div className="bg-white border border-zinc-200 rounded-xl px-5 py-3 mb-4 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-zinc-700">{selectedIds.size} selected</span>
            <select
              value={bulkCategory}
              onChange={e => { setBulkCategory(e.target.value); setBulkSubcategory('') }}
              className="border border-zinc-300 rounded-lg px-3 py-1.5 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              <option value="">Select category…</option>
              {ALL_CATEGORY_NAMES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select
              value={bulkSubcategory}
              onChange={e => setBulkSubcategory(e.target.value)}
              disabled={bulkSubcatOptions.length === 0}
              className="border border-zinc-300 rounded-lg px-3 py-1.5 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-600 disabled:opacity-40"
            >
              <option value="">No subcategory</option>
              {bulkSubcatOptions.map(s => <option key={s}>{s}</option>)}
            </select>
            <button
              onClick={applyBulkEdit}
              disabled={!bulkCategory}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: '#399605' }}
            >
              Apply to {selectedIds.size}
            </button>
            <button
              onClick={() => setPendingBulkDelete(true)}
              className="px-4 py-1.5 rounded-lg text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
            >
              Delete {selectedIds.size}
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors ml-auto"
            >
              Clear selection
            </button>
          </div>
        )}

        {/* Summary */}
        <div className="flex flex-wrap items-center gap-6 mb-6 text-sm">
          <span className="text-zinc-500">
            Showing <span className="font-medium text-zinc-900">{filtered.length}</span> transaction{filtered.length !== 1 ? 's' : ''}
          </span>
          <span className="text-zinc-500">
            Spent: <span className="font-medium text-red-600">{fmt(totalDebit)}</span>
          </span>
          <span className="text-zinc-500">
            Income: <span className="font-medium" style={{ color: '#399605' }}>{fmt(totalCredit)}</span>
          </span>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-zinc-200 px-6 py-16 text-center text-sm text-zinc-400">
            {transactions.length === 0
              ? 'No transactions yet. Upload a CSV to get started.'
              : 'No transactions match your filters.'}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="accent-green-600 cursor-pointer" title="Select all" />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 w-28">Tx date</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 w-28">Imported</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Description</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 w-28">Debit</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 w-28">Credit</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 w-40">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 w-40">Subcategory</th>
                  <th className="w-20 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((tx, i) => {
                  const isSelected = tx.id ? selectedIds.has(tx.id) : false
                  const subcatOptions = getSubcategories(tx.category)
                  return (
                    <tr key={tx.id ?? i} className={`border-b border-zinc-100 last:border-0 ${isSelected ? 'bg-green-50' : 'hover:bg-zinc-50'}`}>
                      <td className="px-4 py-3">
                        {tx.id && <input type="checkbox" checked={isSelected} onChange={() => toggleSelectId(tx.id!)} className="accent-green-600 cursor-pointer" />}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 tabular-nums whitespace-nowrap">{tx.date}</td>
                      <td className="px-4 py-3 text-zinc-400 tabular-nums whitespace-nowrap">{tx.importedAt ?? '—'}</td>
                      <td className="px-4 py-3 text-zinc-900 max-w-xs truncate" title={tx.narration}>{tx.narration}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-red-600">
                        {tx.debit != null ? fmt(tx.debit) : ''}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums" style={{ color: tx.credit != null ? '#399605' : undefined }}>
                        {tx.credit != null ? fmt(tx.credit) : ''}
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={tx.category}
                          onChange={async e => {
                            const newCat = e.target.value
                            await updateTransaction(tx.id!, newCat, null)
                            setRulePrompt({ id: tx.id!, narration: tx.narration, pattern: tx.narration, category: newCat, subcategory: null })
                            setRuleMatchType('contains')
                            setRuleMatchCase(false)
                          }}
                          className="w-full border border-zinc-200 rounded-md px-2 py-1.5 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-600"
                        >
                          <option value="">— none —</option>
                          {ALL_CATEGORY_NAMES.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={tx.subcategory ?? ''}
                          onChange={async e => {
                            const newSub = e.target.value || null
                            await updateTransaction(tx.id!, tx.category, newSub)
                            setRulePrompt({ id: tx.id!, narration: tx.narration, pattern: tx.narration, category: tx.category, subcategory: newSub })
                            setRuleMatchType('contains')
                            setRuleMatchCase(false)
                          }}
                          disabled={subcatOptions.length === 0}
                          className="w-full border border-zinc-200 rounded-md px-2 py-1.5 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-600 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <option value="">— none —</option>
                          {subcatOptions.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {tx.id && (
                          <button
                            onClick={() => setPendingDelete(tx.id!)}
                            className="text-zinc-300 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-zinc-500">Page {page} of {pageCount}</span>
            <button
              onClick={() => setPage(p => Math.min(pageCount, p + 1))}
              disabled={page === pageCount}
              className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {pendingDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-zinc-900 mb-2">Delete transaction?</h3>
            <p className="text-sm text-zinc-500 mb-6">
              This will permanently remove the transaction from your history.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setPendingDelete(null)}
                className="px-4 py-2 text-sm rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk delete confirmation */}
      {pendingBulkDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-zinc-900 mb-2">Delete {selectedIds.size} transaction{selectedIds.size !== 1 ? 's' : ''}?</h3>
            <p className="text-sm text-zinc-500 mb-6">
              This will permanently remove all selected transactions. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setPendingBulkDelete(false)}
                className="px-4 py-2 text-sm rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700"
              >
                Delete all
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate review modal */}
      {duplicateGroups !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[85vh]">
            <div className="px-6 pt-6 pb-4 border-b border-zinc-200">
              <h2 className="text-base font-semibold text-zinc-900 mb-1">
                {duplicateGroups.length === 0 ? 'No duplicates found' : `${duplicateGroups.length} potential duplicate group${duplicateGroups.length !== 1 ? 's' : ''} found`}
              </h2>
              {duplicateGroups.length > 0 && (
                <p className="text-sm text-zinc-500">
                  Transactions with the same date, description, and amount are shown below. Tick the ones to delete.
                </p>
              )}
            </div>
            {duplicateGroups.length > 0 && (
              <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
                {duplicateGroups.map((group, gi) => (
                  <div key={gi} className="border border-zinc-200 rounded-lg overflow-hidden">
                    <div className="bg-zinc-50 px-4 py-2 text-xs font-medium text-zinc-500 border-b border-zinc-200">
                      {group[0].date} · {group[0].narration} · {group[0].debit != null ? `-$${group[0].debit.toFixed(2)}` : `+$${(group[0].credit ?? 0).toFixed(2)}`}
                    </div>
                    {group.map(tx => (
                      <label key={tx.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 cursor-pointer border-b border-zinc-100 last:border-0">
                        <input
                          type="checkbox"
                          checked={duplicatesToDelete.has(tx.id!)}
                          onChange={() => {
                            setDuplicatesToDelete(prev => {
                              const next = new Set(prev)
                              next.has(tx.id!) ? next.delete(tx.id!) : next.add(tx.id!)
                              return next
                            })
                          }}
                          className="accent-red-600 w-4 h-4 shrink-0"
                        />
                        <span className="text-sm text-zinc-700 flex-1">
                          Imported {tx.importedAt ?? 'unknown'}
                        </span>
                        <span className="text-sm text-zinc-500">{tx.category}{tx.subcategory ? ` / ${tx.subcategory}` : ''}</span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            )}
            <div className="px-6 py-4 border-t border-zinc-200 flex gap-3">
              {duplicateGroups.length > 0 && duplicatesToDelete.size > 0 && (
                <button
                  onClick={deleteDuplicates}
                  className="flex-1 bg-red-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete {duplicatesToDelete.size} transaction{duplicatesToDelete.size !== 1 ? 's' : ''}
                </button>
              )}
              <button
                onClick={() => { setDuplicateGroups(null); setDuplicatesToDelete(new Set()) }}
                className="flex-1 border border-zinc-300 text-zinc-600 text-sm font-medium py-2 px-4 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                {duplicateGroups.length === 0 ? 'Close' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save as rule prompt */}
      {rulePrompt && (() => {
        const patternValue = rulePrompt.pattern.trim() || rulePrompt.narration
        const existingRule = rules.find(r => r.pattern.toLowerCase() === patternValue.toLowerCase())
        return (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-base font-semibold text-zinc-900 mb-1">Save this mapping?</h2>
              <p className="text-sm text-zinc-500 mb-4">
                Would you like to save this as a rule so future uploads are categorised the same way?
              </p>
              <div className="bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 mb-4 text-sm">
                <p className="text-zinc-900 font-medium">
                  {rulePrompt.category}
                  {rulePrompt.subcategory && <span className="text-zinc-500 font-normal"> / {rulePrompt.subcategory}</span>}
                </p>
              </div>
              <div className="flex flex-col gap-1 mb-4">
                <label className="text-xs text-zinc-500 font-medium">Pattern</label>
                <input
                  type="text"
                  value={rulePrompt.pattern}
                  onChange={e => setRulePrompt(p => p ? { ...p, pattern: e.target.value } : p)}
                  className="border border-zinc-300 rounded-lg px-3 py-2 text-sm font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {rulePrompt.pattern !== rulePrompt.narration && (
                  <p className="text-xs text-zinc-400 truncate">From: {rulePrompt.narration}</p>
                )}
              </div>
              {(() => {
                const ruleSubcatOptions = getSubcategories(rulePrompt.category)
                return ruleSubcatOptions.length > 0 ? (
                  <div className="flex flex-col gap-1 mb-4">
                    <label className="text-xs text-zinc-500 font-medium">Subcategory</label>
                    <select
                      value={rulePrompt.subcategory ?? ''}
                      onChange={e => setRulePrompt(p => p ? { ...p, subcategory: e.target.value || null } : p)}
                      className="border border-zinc-300 rounded-lg px-3 py-2 text-sm bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No subcategory</option>
                      {ruleSubcatOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                ) : null
              })()}
              {existingRule && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-sm">
                  <p className="text-amber-800 font-medium mb-0.5">Existing rule found</p>
                  <p className="text-amber-700 text-xs">
                    Pattern: <span className="font-mono">{existingRule.pattern}</span> → {existingRule.category}{existingRule.subcategory ? ` / ${existingRule.subcategory}` : ''}
                  </p>
                </div>
              )}
              <div className="flex flex-wrap gap-3 items-end mb-5">
                <div className="flex flex-col gap-1 flex-1 min-w-32">
                  <label className="text-xs text-zinc-500 font-medium">Match type</label>
                  <select
                    value={ruleMatchType}
                    onChange={e => setRuleMatchType(e.target.value as MatchType)}
                    className="border border-zinc-300 rounded-lg px-3 py-2 text-sm bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {(Object.entries(MATCH_LABELS) as [MatchType, string][]).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1 justify-end pb-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ruleMatchCase}
                      onChange={e => setRuleMatchCase(e.target.checked)}
                      className="accent-blue-600 w-4 h-4"
                    />
                    <span className="text-sm text-zinc-600">Case-sensitive</span>
                  </label>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveRule}
                    className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {existingRule ? 'Update rule' : 'Yes, save as rule'}
                  </button>
                  <button
                    onClick={() => { setRulePrompt(null); setRuleMatchType('contains'); setRuleMatchCase(false) }}
                    className="flex-1 border border-zinc-300 text-zinc-600 text-sm font-medium py-2 px-4 rounded-lg hover:bg-zinc-50 transition-colors"
                  >
                    This change only
                  </button>
                </div>
                {existingRule && (
                  <button
                    onClick={() => { deleteRule(existingRule.id); setRulePrompt(null); setRuleMatchType('contains'); setRuleMatchCase(false) }}
                    className="w-full border border-red-200 text-red-600 text-sm font-medium py-2 px-4 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Delete this rule
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Retroactive re-categorisation prompt */}
      {retroPrompt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-base font-semibold text-zinc-900 mb-1">Apply to existing transactions?</h2>
            <p className="text-sm text-zinc-500 mb-4">
              {retroPrompt.matchingIds.length} existing transaction{retroPrompt.matchingIds.length !== 1 ? 's' : ''} match this rule but {retroPrompt.matchingIds.length !== 1 ? 'are' : 'is'} categorised differently.
            </p>
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 mb-5 text-sm">
              <p className="text-zinc-900 font-medium">
                {retroPrompt.category}
                {retroPrompt.subcategory && <span className="text-zinc-500 font-normal"> / {retroPrompt.subcategory}</span>}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                disabled={retroApplying}
                onClick={async () => {
                  setRetroApplying(true)
                  await bulkUpdateCategory(retroPrompt.matchingIds, retroPrompt.category, retroPrompt.subcategory)
                  setRetroApplying(false)
                  setRetroPrompt(null)
                }}
                className="w-full bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {retroApplying ? 'Applying…' : `Yes, apply to ${retroPrompt.matchingIds.length} existing transaction${retroPrompt.matchingIds.length !== 1 ? 's' : ''}`}
              </button>
              <button
                disabled={retroApplying}
                onClick={() => setRetroPrompt(null)}
                className="w-full border border-zinc-300 text-zinc-600 text-sm font-medium py-2 px-4 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                No, only apply this rule from now on
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
