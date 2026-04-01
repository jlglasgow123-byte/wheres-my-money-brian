import type { Transaction } from '@/lib/normaliser/types'

interface Props {
  transaction: Transaction
  current: number  // 1-based
  total: number
  onImport: () => void
  onSkip: () => void
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`
}

function trimNarration(narration: string): string {
  return narration.replace(/\s+/g, ' ').trim()
}

export default function DuplicateModal({ transaction, current, total, onImport, onSkip }: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl border border-zinc-200 shadow-lg w-full max-w-sm p-6">
        <p className="text-xs font-medium text-zinc-400 mb-4">
          Duplicate {current} of {total}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Date</span>
            <span className="text-zinc-900 font-medium">{formatDate(transaction.date)}</span>
          </div>
          <div className="flex justify-between text-sm gap-4">
            <span className="text-zinc-500 shrink-0">Description</span>
            <span className="text-zinc-900 text-right">{trimNarration(transaction.narration)}</span>
          </div>
          {transaction.debit !== null && (
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Debit</span>
              <span className="text-zinc-900 font-mono">-${transaction.debit.toFixed(2)}</span>
            </div>
          )}
          {transaction.credit !== null && (
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Credit</span>
              <span className="text-zinc-900 font-mono">+${transaction.credit.toFixed(2)}</span>
            </div>
          )}
        </div>

        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-5">
          This transaction already exists in your history.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onSkip}
            className="flex-1 border border-zinc-300 text-zinc-700 text-sm font-medium py-2 px-4 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={onImport}
            className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Import
          </button>
        </div>
      </div>
    </div>
  )
}
