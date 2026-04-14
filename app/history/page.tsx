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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PendingEdit = {
  category: string
  subcategory: string | null
}

type ChangeRow = {
  txId: string
  narration: string
  fromCategory: string
  fromSubcategory: string | null
  category: string
  subcategory: string | null
  createRule: boolean
  pattern: string
  matchType: MatchType
  caseSensitive: boolean
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TransactionsPage() {
  const { transactions, deleteTransaction, updateTransaction, bulkUpdateCategory, loaded: historyLoaded } = useHistoryStore()
  const { rules, addRule, updateRule, deleteRule } = useRulesStore()
  const allCategories = useAllCategories()
  const getSubcategories = useGetSubcategories()
  const ALL_CATEGORY_NAMES = allCategories.map(c => c.name)

  // Display filters
  const [typeFilter, setTypeFilter] = useState('Income and Spending')
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [selectedSubcategory, setSelectedSubcategory] = useState('')
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

  // Edit mode
  const [editMode, setEditMode] = useState(false)
  const [pendingEdits, setPendingEdits] = useState<Record<string, PendingEdit>>({})

  // Summary modal
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [changeRows, setChangeRows] = useState<ChangeRow[]>([])

  // Retro warning
  const [showRetroWarning, setShowRetroWarning] = useState(false)
  const [retroRules, setRetroRules] = useState<Array<ChangeRow & { affectedCount: number }>>([])
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

  const subcatOptions = useMemo(() => {
    const txs = selectedCategories.size > 0
      ? transactions.filter(tx => selectedCategories.has(tx.category))
      : transactions
    return Array.from(new Set(txs.map(tx => tx.subcategory).filter((s): s is string => !!s))).sort()
  }, [transactions, selectedCategories])

  const filtered = useMemo(() => {
    let result = transactions
    if (typeFilter === 'Spending') result = result.filter(tx => tx.debit != null)
    if (typeFilter === 'Income') result = result.filter(tx => tx.credit != null)
    if (selectedCategories.size > 0) result = result.filter(tx => selectedCategories.has(tx.category))
    if (selectedSubcategory) result = result.filter(tx => tx.subcategory === selectedSubcategory)
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
  }, [transactions, typeFilter, selectedCategories, selectedSubcategory, search, dateFrom, dateTo, importDateFrom, importDateTo, amountMin, amountMax])

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
    setSelectedSubcategory('')
    setPage(1)
  }

  function clearCategories() { setSelectedCategories(new Set()); setSelectedSubcategory(''); setPage(1) }
  function selectAllCategories() { setSelectedCategories(new Set(categories)); setSelectedSubcategory(''); setPage(1) }

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
    if (editMode) {
      setPendingEdits(prev => {
        const next = { ...prev }
        for (const id of selectedIds) next[id] = { category: bulkCategory, subcategory: sub }
        return next
      })
    } else {
      await Promise.all(Array.from(selectedIds).map(id => updateTransaction(id, bulkCategory, sub)))
    }
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

  // ---------------------------------------------------------------------------
  // Edit mode
  // ---------------------------------------------------------------------------

  function handleEditCategoryChange(txId: string, newCat: string) {
    setPendingEdits(prev => ({
      ...prev,
      [txId]: { category: newCat, subcategory: null },
    }))
  }

  function handleEditSubcatChange(txId: string, currentCat: string, newSubcat: string | null) {
    setPendingEdits(prev => ({
      ...prev,
      [txId]: { category: prev[txId]?.category ?? currentCat, subcategory: newSubcat },
    }))
  }

  function cancelEdit() {
    setPendingEdits({})
    setEditMode(false)
    setSelectedIds(new Set())
  }

  function handleSaveChanges() {
    const changes: ChangeRow[] = []
    for (const [txId, edit] of Object.entries(pendingEdits)) {
      const tx = transactions.find(t => t.id === txId)
      if (!tx) continue
      if (tx.category === edit.category && tx.subcategory === edit.subcategory) continue
      changes.push({
        txId,
        narration: tx.narration,
        fromCategory: tx.category,
        fromSubcategory: tx.subcategory,
        category: edit.category,
        subcategory: edit.subcategory,
        createRule: true,
        pattern: tx.narration,
        matchType: 'contains',
        caseSensitive: false,
      })
    }
    if (changes.length === 0) {
      cancelEdit()
      return
    }
    setChangeRows(changes)
    setShowSummaryModal(true)
  }

  function updateChangeRow(i: number, updates: Partial<ChangeRow>) {
    setChangeRows(prev => prev.map((row, idx) => {
      if (idx !== i) return row
      const updated = { ...row, ...updates }
      // Reset subcategory when category changes
      if ('category' in updates && updates.category !== row.category) updated.subcategory = null
      return updated
    }))
  }

  async function handleConfirmSave() {
    // Find rules that would retroactively affect already-categorised transactions
    const withRetro: Array<ChangeRow & { affectedCount: number }> = []
    for (const row of changeRows) {
      if (!row.createRule) continue
      const rule: MappingRule = {
        id: '',
        pattern: row.pattern.trim(),
        matchType: row.matchType,
        caseSensitive: row.caseSensitive,
        category: row.category,
        subcategory: row.subcategory,
        userMapped: true,
      }
      const matchingIds = transactions
        .filter(tx =>
          tx.id !== row.txId &&
          matchesRule(tx.narration, rule) &&
          tx.category !== 'Uncategorised' &&
          (tx.category !== row.category || tx.subcategory !== row.subcategory)
        )
        .map(tx => tx.id!)
        .filter(Boolean)
      if (matchingIds.length > 0) {
        withRetro.push({ ...row, affectedCount: matchingIds.length })
      }
    }

    if (withRetro.length > 0) {
      setRetroRules(withRetro)
      setShowSummaryModal(false)
      setShowRetroWarning(true)
      return
    }

    await applyAllChanges(false)
  }

  async function applyAllChanges(retroActive: boolean) {
    setRetroApplying(true)

    // Apply transaction category changes
    await Promise.all(changeRows.map(row =>
      updateTransaction(row.txId, row.category, row.subcategory)
    ))

    // Create or update rules, and optionally apply retroactively
    for (const row of changeRows) {
      if (!row.createRule) continue
      const pattern = row.pattern.trim()
      const rule: MappingRule = {
        id: crypto.randomUUID(),
        pattern,
        matchType: row.matchType,
        caseSensitive: row.caseSensitive,
        category: row.category,
        subcategory: row.subcategory,
        userMapped: true,
      }
      const existing = rules.find(r => r.pattern.toLowerCase() === pattern.toLowerCase())
      if (existing) {
        await updateRule(existing.id, {
          pattern,
          matchType: row.matchType,
          caseSensitive: row.caseSensitive,
          category: row.category,
          subcategory: row.subcategory,
          userMapped: true,
        })
      } else {
        await addRule(rule)
      }

      if (retroActive) {
        const matchingIds = transactions
          .filter(tx =>
            tx.id !== row.txId &&
            matchesRule(tx.narration, rule) &&
            tx.category !== 'Uncategorised'
          )
          .map(tx => tx.id!)
          .filter(Boolean)
        if (matchingIds.length > 0) {
          await bulkUpdateCategory(matchingIds, row.category, row.subcategory)
        }
      }
    }

    setPendingEdits({})
    setEditMode(false)
    setSelectedIds(new Set())
    setChangeRows([])
    setRetroRules([])
    setShowSummaryModal(false)
    setShowRetroWarning(false)
    setRetroApplying(false)
  }

  if (!historyLoaded) return <Spinner />

  return (
    <main className="min-h-screen bg-zinc-50">
      {/* Top bar */}
      <div className="bg-white border-b border-zinc-200 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-zinc-500">
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} saved
          </p>
          {editMode ? (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5">
                Edit mode — changes are not saved until you click Save changes
              </span>
              <button
                onClick={cancelEdit}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-zinc-300 text-zinc-600 bg-white hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: '#399605' }}
              >
                Save changes {Object.keys(pendingEdits).length > 0 ? `(${Object.keys(pendingEdits).length})` : ''}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
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
              {transactions.length > 0 && (
                <button
                  onClick={() => setEditMode(true)}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-zinc-300 text-zinc-600 bg-white hover:bg-zinc-50 transition-colors"
                >
                  Edit transactions
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
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-xl font-semibold text-zinc-900 mb-6">Transactions</h1>

        {/* Filter panel */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <span title="Filter by one or more spending categories." className="ml-1 relative -top-1.5 inline-flex items-center justify-center w-3 h-3 rounded-full bg-zinc-100 text-zinc-400 text-[9px] cursor-help shrink-0">?</span>
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
                            <input type="checkbox" checked={selectedCategories.has(cat)} onChange={() => toggleCategory(cat)} className="accent-green-600" />
                            <span className="text-sm text-zinc-800">{cat}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center text-sm text-zinc-600 w-36 shrink-0">
                  Subcategory
                </span>
                <select
                  value={selectedSubcategory}
                  onChange={e => { setSelectedSubcategory(e.target.value); setPage(1) }}
                  disabled={selectedCategories.size === 0}
                  className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-600 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {selectedCategories.size === 0
                    ? <option value="">Select a category first</option>
                    : <>
                        <option value="">All subcategories</option>
                        {subcatOptions.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </>
                  }
                </select>
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Search</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center text-sm text-zinc-600 w-32 shrink-0">
                  Description
                  <span title="Search by transaction description or merchant name." className="ml-1 relative -top-1.5 inline-flex items-center justify-center w-3 h-3 rounded-full bg-zinc-100 text-zinc-400 text-[9px] cursor-help shrink-0">?</span>
                </span>
                <input type="text" placeholder="Search…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="flex-1 min-w-0 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-green-600" />
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center text-sm text-zinc-600 w-32 shrink-0">
                  Transaction date
                  <span title="Filter by the date the transaction occurred on your bank statement." className="ml-1 relative -top-1.5 inline-flex items-center justify-center w-3 h-3 rounded-full bg-zinc-100 text-zinc-400 text-[9px] cursor-help shrink-0">?</span>
                </span>
                <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }} className="flex-1 min-w-0 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-green-600" />
                <span className="text-xs text-zinc-400 shrink-0">to</span>
                <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }} className="flex-1 min-w-0 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-green-600" />
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center text-sm text-zinc-600 w-32 shrink-0">
                  Import date
                  <span title="Filter by the date you uploaded this batch of transactions." className="ml-1 relative -top-1.5 inline-flex items-center justify-center w-3 h-3 rounded-full bg-zinc-100 text-zinc-400 text-[9px] cursor-help shrink-0">?</span>
                </span>
                <input type="date" value={importDateFrom} onChange={e => { setImportDateFrom(e.target.value); setPage(1) }} className="flex-1 min-w-0 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-green-600" />
                <span className="text-xs text-zinc-400 shrink-0">to</span>
                <input type="date" value={importDateTo} onChange={e => { setImportDateTo(e.target.value); setPage(1) }} className="flex-1 min-w-0 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-green-600" />
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center text-sm text-zinc-600 w-32 shrink-0">
                  Amount
                  <span title="Filter by transaction amount." className="ml-1 relative -top-1.5 inline-flex items-center justify-center w-3 h-3 rounded-full bg-zinc-100 text-zinc-400 text-[9px] cursor-help shrink-0">?</span>
                </span>
                <input type="number" placeholder="Min" value={amountMin} min="0" onChange={e => { setAmountMin(e.target.value); setPage(1) }} className="flex-1 min-w-0 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-green-600" />
                <span className="text-xs text-zinc-400 shrink-0">to</span>
                <input type="number" placeholder="Max" value={amountMax} min="0" onChange={e => { setAmountMax(e.target.value); setPage(1) }} className="flex-1 min-w-0 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-green-600" />
              </div>
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end pt-2 border-t border-zinc-100">
            <button
              onClick={() => {
                setTypeFilter('Income and Spending'); setSelectedCategories(new Set()); setSearch('')
                setDateFrom(''); setDateTo(''); setImportDateFrom(''); setImportDateTo('')
                setAmountMin(''); setAmountMax(''); setPage(1)
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
              {editMode ? 'Stage for' : 'Apply to'} {selectedIds.size}
            </button>
            <button
              onClick={() => setPendingBulkDelete(true)}
              className="px-4 py-1.5 rounded-lg text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
            >
              Delete {selectedIds.size}
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors ml-auto">
              Clear selection
            </button>
          </div>
        )}

        {/* Summary */}
        <div className="flex flex-wrap items-center gap-6 mb-6 text-sm">
          <span className="text-zinc-500">
            Showing <span className="font-medium text-zinc-900">{filtered.length}</span> transaction{filtered.length !== 1 ? 's' : ''}
          </span>
          <span className="text-zinc-500">Spent: <span className="font-medium text-red-600">{fmt(totalDebit)}</span></span>
          <span className="text-zinc-500">Income: <span className="font-medium" style={{ color: '#399605' }}>{fmt(totalCredit)}</span></span>
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
                  <th className="w-20 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {paginated.map((tx, i) => {
                  const isSelected = tx.id ? selectedIds.has(tx.id) : false
                  const editCat = (tx.id && pendingEdits[tx.id]?.category) ?? tx.category
                  const editSubcat = tx.id && tx.id in pendingEdits ? pendingEdits[tx.id].subcategory : tx.subcategory
                  const subcatOptions = getSubcategories(editCat)
                  const hasPendingChange = tx.id ? tx.id in pendingEdits : false
                  return (
                    <tr
                      key={tx.id ?? i}
                      className={`border-b border-zinc-100 last:border-0 ${
                        hasPendingChange ? 'bg-amber-50' : isSelected ? 'bg-green-50' : 'hover:bg-zinc-50'
                      }`}
                    >
                      <td className="px-4 py-3">
                        {tx.id && <input type="checkbox" checked={isSelected} onChange={() => toggleSelectId(tx.id!)} className="accent-green-600 cursor-pointer" />}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 tabular-nums whitespace-nowrap">{tx.date}</td>
                      <td className="px-4 py-3 text-zinc-400 tabular-nums whitespace-nowrap">{tx.importedAt ?? '—'}</td>
                      <td className="px-4 py-3 text-zinc-900 max-w-xs truncate" title={tx.narration}>{tx.narration}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-red-600">{tx.debit != null ? fmt(tx.debit) : ''}</td>
                      <td className="px-4 py-3 text-right tabular-nums" style={{ color: tx.credit != null ? '#399605' : undefined }}>{tx.credit != null ? fmt(tx.credit) : ''}</td>

                      {/* Category */}
                      <td className="px-2 py-2">
                        {editMode ? (
                          <select
                            value={editCat}
                            onChange={e => tx.id && handleEditCategoryChange(tx.id, e.target.value)}
                            className="w-full border border-zinc-200 rounded-md px-2 py-1.5 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                          >
                            <option value="Uncategorised">Uncategorised</option>
                            {ALL_CATEGORY_NAMES.map(c => <option key={c}>{c}</option>)}
                          </select>
                        ) : (
                          <span className="px-2 text-sm text-zinc-700">{tx.category}</span>
                        )}
                      </td>

                      {/* Subcategory */}
                      <td className="px-2 py-2">
                        {editMode ? (
                          <select
                            value={editSubcat ?? ''}
                            onChange={e => tx.id && handleEditSubcatChange(tx.id, editCat, e.target.value || null)}
                            disabled={subcatOptions.length === 0}
                            className="w-full border border-zinc-200 rounded-md px-2 py-1.5 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <option value="">— none —</option>
                            {subcatOptions.map(s => <option key={s}>{s}</option>)}
                          </select>
                        ) : (
                          <span className="px-2 text-sm text-zinc-500">{tx.subcategory ?? '—'}</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {tx.id && !editMode && (
                          <button onClick={() => setPendingDelete(tx.id!)} className="text-zinc-300 hover:text-red-500 transition-colors" title="Delete">
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
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-40">Previous</button>
            <span className="text-xs text-zinc-500">Page {page} of {pageCount}</span>
            <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount} className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-40">Next</button>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Modals                                                               */}
      {/* ------------------------------------------------------------------ */}

      {/* Delete single */}
      {pendingDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-zinc-900 mb-2">Delete transaction?</h3>
            <p className="text-sm text-zinc-500 mb-6">This will permanently remove the transaction from your history.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setPendingDelete(null)} className="px-4 py-2 text-sm rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk delete */}
      {pendingBulkDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-zinc-900 mb-2">Delete {selectedIds.size} transaction{selectedIds.size !== 1 ? 's' : ''}?</h3>
            <p className="text-sm text-zinc-500 mb-6">This will permanently remove all selected transactions. This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setPendingBulkDelete(false)} className="px-4 py-2 text-sm rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50">Cancel</button>
              <button onClick={handleBulkDelete} className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700">Delete all</button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate review */}
      {duplicateGroups !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[85vh]">
            <div className="px-6 pt-6 pb-4 border-b border-zinc-200">
              <h2 className="text-base font-semibold text-zinc-900 mb-1">
                {duplicateGroups.length === 0 ? 'No duplicates found' : `${duplicateGroups.length} potential duplicate group${duplicateGroups.length !== 1 ? 's' : ''} found`}
              </h2>
              {duplicateGroups.length > 0 && <p className="text-sm text-zinc-500">Transactions with the same date, description, and amount are shown below. Tick the ones to delete.</p>}
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
                        <span className="text-sm text-zinc-700 flex-1">Imported {tx.importedAt ?? 'unknown'}</span>
                        <span className="text-sm text-zinc-500">{tx.category}{tx.subcategory ? ` / ${tx.subcategory}` : ''}</span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            )}
            <div className="px-6 py-4 border-t border-zinc-200 flex gap-3">
              {duplicateGroups.length > 0 && duplicatesToDelete.size > 0 && (
                <button onClick={deleteDuplicates} className="flex-1 bg-red-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
                  Delete {duplicatesToDelete.size} transaction{duplicatesToDelete.size !== 1 ? 's' : ''}
                </button>
              )}
              <button onClick={() => { setDuplicateGroups(null); setDuplicatesToDelete(new Set()) }} className="flex-1 border border-zinc-300 text-zinc-600 text-sm font-medium py-2 px-4 rounded-lg hover:bg-zinc-50 transition-colors">
                {duplicateGroups.length === 0 ? 'Close' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save changes — summary modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
            <div className="px-6 pt-6 pb-4 border-b border-zinc-200">
              <h2 className="text-base font-semibold text-zinc-900">
                Save {changeRows.length} change{changeRows.length !== 1 ? 's' : ''}
              </h2>
              <p className="text-sm text-zinc-500 mt-1">
                Review each change. Tick the checkbox to also create a rule so future uploads are categorised the same way.
              </p>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-zinc-100">
              {changeRows.map((row, i) => {
                const subcatOpts = getSubcategories(row.category)
                return (
                  <div key={row.txId} className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      {/* Checkbox — create rule */}
                      <div className="pt-0.5">
                        <input
                          type="checkbox"
                          checked={row.createRule}
                          onChange={e => updateChangeRow(i, { createRule: e.target.checked })}
                          className="accent-blue-600 w-4 h-4 cursor-pointer"
                          title="Create a rule for future uploads"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Narration */}
                        <p className="text-sm font-medium text-zinc-900 truncate" title={row.narration}>{row.narration}</p>

                        {/* From → To */}
                        <p className="text-xs text-zinc-400 mt-0.5">
                          <span className="text-zinc-500">{row.fromCategory}{row.fromSubcategory ? ` / ${row.fromSubcategory}` : ''}</span>
                          {' → '}
                        </p>

                        {/* Editable category / subcategory */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          <select
                            value={row.category}
                            onChange={e => updateChangeRow(i, { category: e.target.value, subcategory: null })}
                            className="border border-zinc-300 rounded-md px-2 py-1.5 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Uncategorised">Uncategorised</option>
                            {ALL_CATEGORY_NAMES.map(c => <option key={c}>{c}</option>)}
                          </select>
                          <select
                            value={row.subcategory ?? ''}
                            onChange={e => updateChangeRow(i, { subcategory: e.target.value || null })}
                            disabled={subcatOpts.length === 0}
                            className="border border-zinc-300 rounded-md px-2 py-1.5 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <option value="">No subcategory</option>
                            {subcatOpts.map(s => <option key={s}>{s}</option>)}
                          </select>
                        </div>

                        {/* Rule options — only show when checkbox is ticked */}
                        {row.createRule && (
                          <div className="mt-3 bg-zinc-50 border border-zinc-200 rounded-lg p-3 flex flex-wrap gap-3 items-center">
                            <span className="text-xs font-medium text-zinc-500">Rule</span>
                            <input
                              type="text"
                              value={row.pattern}
                              onChange={e => updateChangeRow(i, { pattern: e.target.value })}
                              className="flex-1 min-w-40 border border-zinc-300 rounded-md px-2.5 py-1.5 text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Pattern"
                            />
                            <select
                              value={row.matchType}
                              onChange={e => updateChangeRow(i, { matchType: e.target.value as MatchType })}
                              className="border border-zinc-300 rounded-md px-2 py-1.5 text-xs text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {(Object.entries(MATCH_LABELS) as [MatchType, string][]).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                              ))}
                            </select>
                            <label className="flex items-center gap-1.5 text-xs text-zinc-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={row.caseSensitive}
                                onChange={e => updateChangeRow(i, { caseSensitive: e.target.checked })}
                                className="accent-blue-600"
                              />
                              Case-sensitive
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="px-6 py-4 border-t border-zinc-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowSummaryModal(false)}
                className="border border-zinc-300 text-zinc-600 text-sm font-medium py-2 px-4 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleConfirmSave}
                className="bg-blue-600 text-white text-sm font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Retroactive warning modal */}
      {showRetroWarning && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-base font-semibold text-zinc-900 mb-2">Historical transactions will be updated</h2>
            <p className="text-sm text-zinc-600 mb-4">
              You are about to create one or more rules that match existing categorised transactions. This will update their category and/or subcategory. Are you sure you want to proceed?
            </p>
            <div className="space-y-2 bg-zinc-50 border border-zinc-200 rounded-lg p-4">
              {retroRules.map(row => (
                <div key={row.txId} className="text-sm">
                  <span className="font-mono text-zinc-600 text-xs">{row.pattern}</span>
                  <span className="ml-2 text-zinc-900 font-medium">
                    → {row.category}{row.subcategory ? ` / ${row.subcategory}` : ''}
                  </span>
                  <span className="ml-2 text-xs text-zinc-400">
                    ({row.affectedCount} existing transaction{row.affectedCount !== 1 ? 's' : ''})
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                disabled={retroApplying}
                onClick={() => { setShowRetroWarning(false); setShowSummaryModal(true) }}
                className="flex-1 border border-zinc-300 text-zinc-600 text-sm font-medium py-2 px-4 rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                disabled={retroApplying}
                onClick={() => applyAllChanges(true)}
                className="flex-1 bg-blue-600 text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {retroApplying ? 'Saving…' : 'Yes, update history'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
