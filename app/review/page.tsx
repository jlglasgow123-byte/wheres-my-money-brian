'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useReviewStore } from '@/lib/store/review'
import { useHistoryStore } from '@/lib/store/history'
import type { Transaction } from '@/lib/normaliser/types'

function fmt(n: number) {
  return n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })
}

export default function ReviewPage() {
  const router = useRouter()
  const { items, fileName, malformed, skippedCount, clearBatch } = useReviewStore()
  const { addTransactions } = useHistoryStore()

  useEffect(() => {
    if (items.length === 0) router.replace('/history')
  }, [items.length, router])

  if (items.length === 0) return null

  function handleImport() {
    const transactions: Transaction[] = items.map(item => ({
      ...item.original,
      category: 'Uncategorised',
      subcategory: null,
      confidence: null,
      conflict: false,
      matchedRule: undefined,
    }))
    addTransactions(transactions)
    clearBatch()
    router.replace('/history')
  }

  function handleCancel() {
    clearBatch()
    router.replace('/')
  }

  const totalDebit = items.reduce((sum, i) => sum + (i.original.debit ?? 0), 0)
  const totalCredit = items.reduce((sum, i) => sum + (i.original.credit ?? 0), 0)

  return (
    <main className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">Preview transactions</h1>
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
              onClick={handleImport}
              className="bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Import {items.length} transaction{items.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-5">
        {/* Malformed rows warning */}
        {malformed.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm font-medium text-amber-800">
              {malformed.length} row{malformed.length !== 1 ? 's' : ''} could not be imported due to errors and will be skipped.
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

        {/* Summary strip */}
        <div className="flex gap-6 text-sm text-zinc-500">
          <span><span className="font-medium text-zinc-900">{items.length}</span> transaction{items.length !== 1 ? 's' : ''}</span>
          <span>Spending: <span className="font-medium text-red-600">{fmt(totalDebit)}</span></span>
          <span>Income: <span className="font-medium text-green-700">{fmt(totalCredit)}</span></span>
        </div>

        {/* Transaction table */}
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[130px_1fr_130px] px-5 py-3 border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-500">
            <span>Date</span>
            <span>Description</span>
            <span className="text-right">Amount</span>
          </div>
          {items.map((item, i) => {
            const tx = item.original
            const isDebit = tx.debit != null
            const amountText = isDebit ? `-${fmt(tx.debit!)}` : tx.credit != null ? `+${fmt(tx.credit)}` : ''
            const amountColour = isDebit ? 'text-red-600' : 'text-green-700'
            return (
              <div
                key={i}
                className="grid grid-cols-[130px_1fr_130px] px-5 py-3 border-b border-zinc-100 last:border-0 text-sm"
              >
                <span className="text-zinc-500 font-mono tabular-nums">{tx.date}</span>
                <span className="text-zinc-800 truncate pr-4" title={tx.narration}>{tx.narration}</span>
                <span className={`text-right font-mono tabular-nums ${amountColour}`}>{amountText}</span>
              </div>
            )
          })}
        </div>

        {/* Bottom actions */}
        <div className="flex justify-end gap-3 pb-6">
          <button
            onClick={handleCancel}
            className="border border-zinc-300 text-zinc-600 text-sm font-medium py-2 px-6 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            className="bg-blue-600 text-white text-sm font-medium py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Import {items.length} transaction{items.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </main>
  )
}
