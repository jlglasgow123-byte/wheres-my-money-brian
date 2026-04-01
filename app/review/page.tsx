'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useReviewStore } from '@/lib/store/review'
import { useHistoryStore } from '@/lib/store/history'
import { useRulesStore } from '@/lib/store/rules'
import DraftRow from '@/components/review/DraftRow'
import ReclassifyModal from '@/components/review/ReclassifyModal'
import UncatWarningModal from '@/components/review/UncatWarningModal'
import CategoryInspector from '@/components/upload/CategoryInspector'
import type { Transaction } from '@/lib/normaliser/types'

type ConfidenceFilter = 'all' | 'high' | 'medium' | 'low' | 'uncategorised' | 'conflicts'
type UncatVisibility = 'show-all' | 'show-new' | 'hide'

const SUPPRESS_KEY = 'brian:suppressUncatWarning'

export default function ReviewPage() {
  const router = useRouter()
  const { items, fileName, malformed, skippedCount, updateItem, acceptByConfidence, clearBatch } = useReviewStore()
  const { addTransactions } = useHistoryStore()
  const { addRule } = useRulesStore()

  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>('all')
  const [uncatVisibility, setUncatVisibility] = useState<UncatVisibility>('show-all')
  const [reclassifyQueue, setReclassifyQueue] = useState<Array<{
    index: number
    narration: string
    toCategory: string
    toSubcategory: string | null
  }>>([])
  const [showUncatWarning, setShowUncatWarning] = useState(false)

  useEffect(() => {
    if (items.length === 0) {
      router.replace('/history')
    }
  }, [items.length, router])

  const counts = useMemo(() => ({
    total: items.length,
    high: items.filter(i => i.original.confidence === 'High' && !i.original.conflict).length,
    medium: items.filter(i => i.original.confidence === 'Medium' && !i.original.conflict).length,
    low: items.filter(i => i.original.confidence === 'Low' && !i.original.conflict).length,
    uncategorised: items.filter(i => i.category === 'Uncategorised').length,
    conflicts: items.filter(i => i.original.conflict).length,
  }), [items])

  const filteredItems = useMemo(() => {
    return items
      .map((item, originalIndex) => ({ item, originalIndex }))
      .filter(({ item }) => {
        const isCurrentlyUncat = item.category === 'Uncategorised'
        if (uncatVisibility === 'hide' && isCurrentlyUncat) return false

        switch (confidenceFilter) {
          case 'all': return true
          case 'high': return item.original.confidence === 'High' && !item.original.conflict
          case 'medium': return item.original.confidence === 'Medium' && !item.original.conflict
          case 'low': return item.original.confidence === 'Low' && !item.original.conflict
          case 'uncategorised': return isCurrentlyUncat
          case 'conflicts': return item.original.conflict
          default: return true
        }
      })
  }, [items, confidenceFilter, uncatVisibility])

  function handleChange(index: number, newCategory: string, newSubcategory: string | null) {
    updateItem(index, newCategory, newSubcategory)
  }

  function handleConfirmClick() {
    // Build queue: any item where category or subcategory was changed, and the new category is not Uncategorised
    const queue = items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        if (item.category === 'Uncategorised') return false
        const categoryChanged = item.category !== item.original.category
        const subcategoryChanged = item.subcategory !== item.original.subcategory
        return categoryChanged || subcategoryChanged
      })
      .map(({ item, index }) => ({
        index,
        narration: item.original.narration,
        toCategory: item.category,
        toSubcategory: item.subcategory,
      }))

    if (queue.length > 0) {
      setReclassifyQueue(queue)
      return
    }
    checkUncatAndProceed()
  }

  function handleSaveRule(matchType: import('@/lib/categoriser/types').MatchType, caseSensitive: boolean) {
    const current = reclassifyQueue[0]
    if (!current) return
    addRule({
      id: crypto.randomUUID(),
      pattern: current.narration.trim(),
      matchType,
      caseSensitive,
      category: current.toCategory,
      subcategory: current.toSubcategory,
      userMapped: true,
    })
    advanceQueue()
  }

  function handleSkipRule() {
    advanceQueue()
  }

  function advanceQueue() {
    const remaining = reclassifyQueue.slice(1)
    setReclassifyQueue(remaining)
    if (remaining.length === 0) {
      checkUncatAndProceed()
    }
  }

  function checkUncatAndProceed() {
    const suppressed = localStorage.getItem(SUPPRESS_KEY) === 'true'
    const uncatCount = items.filter(i => i.category === 'Uncategorised').length
    if (uncatCount > 0 && !suppressed) {
      setShowUncatWarning(true)
      return
    }
    commitAndNavigate()
  }

  function commitAndNavigate() {
    const finalTransactions: Transaction[] = items.map(item => ({
      ...item.original,
      category: item.category,
      subcategory: item.subcategory,
    }))
    addTransactions(finalTransactions)
    clearBatch()
    router.replace('/history')
  }

  function handleUncatProceed(suppress: boolean) {
    if (suppress) localStorage.setItem(SUPPRESS_KEY, 'true')
    setShowUncatWarning(false)
    commitAndNavigate()
  }

  function handleCancel() {
    clearBatch()
    router.replace('/')
  }

  const filterTabs: { key: ConfidenceFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.total },
    { key: 'high', label: 'High', count: counts.high },
    { key: 'medium', label: 'Medium', count: counts.medium },
    { key: 'low', label: 'Low', count: counts.low },
    { key: 'uncategorised', label: 'Uncategorised', count: counts.uncategorised },
    { key: 'conflicts', label: 'Conflicts', count: counts.conflicts },
  ]

  const inspectorTransactions = useMemo(
    () => items.map(i => ({ ...i.original, category: i.category, subcategory: i.subcategory })),
    [items]
  )

  if (items.length === 0) return null

  return (
    <main className="min-h-screen bg-zinc-50">
      {/* Review header */}
      <div className="bg-white border-b border-zinc-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">Review your transactions</h1>
            <p className="text-xs font-mono text-zinc-400 mt-0.5">
              {fileName}
              {skippedCount > 0 && ` · ${skippedCount} duplicate${skippedCount !== 1 ? 's' : ''} skipped`}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleCancel}
              className="border border-zinc-300 text-zinc-600 text-sm font-medium py-2 px-4 rounded-lg hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmClick}
              className="bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Confirm import
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Malformed rows warning */}
        {malformed.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm font-medium text-amber-800">
              {malformed.length} row{malformed.length !== 1 ? 's' : ''} could not be imported due to errors.
            </p>
            <ul className="mt-2 space-y-1">
              {malformed.map(row => (
                <li key={row.rowIndex} className="text-xs text-amber-700">
                  <span className="font-medium">Row {row.rowIndex}:</span>{' '}
                  {row.errors.join(' · ')}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Filter bar */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-wrap items-center gap-4">
          {/* Confidence filter tabs */}
          <div className="flex gap-1 flex-wrap">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setConfidenceFilter(tab.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  confidenceFilter === tab.key
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 ml-auto flex-wrap">
            {/* Uncat visibility */}
            <select
              value={uncatVisibility}
              onChange={e => setUncatVisibility(e.target.value as UncatVisibility)}
              className="border border-zinc-200 rounded-md px-2 py-1.5 text-sm font-sans text-zinc-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="show-all">Show all uncategorised</option>
              <option value="show-new">Show only new uncategorised</option>
              <option value="hide">Hide uncategorised</option>
            </select>

            {/* Accept all High */}
            <button
              onClick={() => acceptByConfidence('High')}
              className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-800 text-xs font-medium rounded-md hover:bg-green-100 transition-colors"
            >
              Accept all High
            </button>
          </div>
        </div>

        {/* Transaction list */}
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="flex items-center gap-3 px-4 py-2 border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-500 border-l-4 border-l-transparent">
            <span className="w-24 shrink-0">Date</span>
            <span className="flex-1">Narration</span>
            <span className="w-24 text-right shrink-0">Amount</span>
            <span className="w-44 shrink-0">Category</span>
            <span className="w-44 shrink-0">Subcategory</span>
            <span className="w-16 text-right shrink-0">Confidence</span>
          </div>

          {filteredItems.length === 0 ? (
            <p className="px-4 py-8 text-sm text-zinc-400 text-center">No transactions match the current filter.</p>
          ) : (
            filteredItems.map(({ item, originalIndex }) => (
              <DraftRow
                key={originalIndex}
                item={item}
                index={originalIndex}
                onChange={handleChange}
              />
            ))
          )}
        </div>

        {/* Phase 4 inspector — temporary */}
        <CategoryInspector transactions={inspectorTransactions} />

        {/* Bottom confirm */}
        <div className="flex justify-end gap-3 pb-6">
          <button
            onClick={handleCancel}
            className="border border-zinc-300 text-zinc-600 text-sm font-medium py-2 px-6 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmClick}
            className="bg-blue-600 text-white text-sm font-medium py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Confirm import
          </button>
        </div>
      </div>

      {reclassifyQueue.length > 0 && (
        <ReclassifyModal
          narration={reclassifyQueue[0].narration}
          toCategory={reclassifyQueue[0].toCategory}
          toSubcategory={reclassifyQueue[0].toSubcategory}
          current={reclassifyQueue.length > 1 ? reclassifyQueue.length : undefined}
          onSaveRule={(mt, cs) => handleSaveRule(mt, cs)}
          onSkipRule={handleSkipRule}
        />
      )}

      {showUncatWarning && (
        <UncatWarningModal
          count={counts.uncategorised}
          onProceed={handleUncatProceed}
          onCancel={() => setShowUncatWarning(false)}
        />
      )}
    </main>
  )
}
