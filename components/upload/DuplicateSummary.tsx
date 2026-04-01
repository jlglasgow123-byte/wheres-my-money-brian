import type { Transaction } from '@/lib/normaliser/types'

interface Props {
  duplicates: Transaction[]
  onImportAll: () => void
  onSkipAll: () => void
  onOneByOne: () => void
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`
}

function formatAmount(debit: number | null, credit: number | null): string {
  if (debit !== null) return `-$${debit.toFixed(2)}`
  if (credit !== null) return `+$${credit.toFixed(2)}`
  return '—'
}

function trimNarration(narration: string): string {
  return narration.replace(/\s+/g, ' ').trim()
}

export default function DuplicateSummary({ duplicates, onImportAll, onSkipAll, onOneByOne }: Props) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <p className="text-sm font-medium text-amber-800 mb-1">
        {duplicates.length} duplicate transaction{duplicates.length !== 1 ? 's' : ''} detected
      </p>
      <p className="text-sm text-amber-700 mb-3">
        These transactions already exist in your history. How would you like to handle them?
      </p>

      <ul className="mb-4 space-y-1.5 max-h-48 overflow-y-auto">
        {duplicates.map((tx, i) => (
          <li key={i} className="flex items-center justify-between gap-4 text-xs text-amber-800 bg-amber-100 rounded px-3 py-1.5">
            <span className="text-amber-600 shrink-0">{formatDate(tx.date)}</span>
            <span className="flex-1 truncate">{trimNarration(tx.narration)}</span>
            <span className="shrink-0 font-mono">{formatAmount(tx.debit, tx.credit)}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          onClick={onSkipAll}
          className="flex-1 border border-amber-400 text-amber-800 text-sm font-medium py-2 px-3 rounded-lg hover:bg-amber-100 transition-colors"
        >
          Skip duplicates
        </button>
        <button
          onClick={onOneByOne}
          className="flex-1 border border-amber-400 text-amber-800 text-sm font-medium py-2 px-3 rounded-lg hover:bg-amber-100 transition-colors"
        >
          Decide one by one
        </button>
        <button
          onClick={onImportAll}
          className="flex-1 border border-amber-400 text-amber-800 text-sm font-medium py-2 px-3 rounded-lg hover:bg-amber-100 transition-colors"
        >
          Import all
        </button>
      </div>
    </div>
  )
}
