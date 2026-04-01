import type { ReviewItem } from '@/lib/store/review'
import { DEFAULT_CATEGORIES, getSubcategories } from '@/lib/categories/defaults'
import type { Transaction } from '@/lib/normaliser/types'

interface Props {
  item: ReviewItem
  index: number
  onChange: (index: number, category: string, subcategory: string | null) => void
}

function borderClass(item: ReviewItem): string {
  if (item.original.conflict) return 'border-l-4 border-red-500'
  switch (item.original.confidence) {
    case 'High': return 'border-l-4 border-green-400'
    case 'Medium': return 'border-l-4 border-amber-400'
    case 'Low': return 'border-l-4 border-red-300'
    default: return 'border-l-4 border-zinc-200'
  }
}

function ConfidenceBadge({ item }: { item: ReviewItem }) {
  if (item.original.conflict) {
    return <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Conflict</span>
  }
  if (!item.original.confidence) {
    return <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-500">Uncat</span>
  }
  const styles = {
    High: 'bg-green-100 text-green-800',
    Medium: 'bg-amber-100 text-amber-800',
    Low: 'bg-red-100 text-red-800',
  }
  return (
    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${styles[item.original.confidence]}`}>
      {item.original.confidence}
    </span>
  )
}

function formatAmount(tx: Transaction): { text: string; colour: string } {
  if (tx.debit != null) return { text: `-$${tx.debit.toFixed(2)}`, colour: 'text-red-600' }
  if (tx.credit != null) return { text: `+$${tx.credit.toFixed(2)}`, colour: 'text-green-700' }
  return { text: '', colour: '' }
}

export default function DraftRow({ item, index, onChange }: Props) {
  const subcategories = getSubcategories(item.category)
  const amount = formatAmount(item.original)

  function handleCategoryChange(newCategory: string) {
    onChange(index, newCategory, null)
  }

  function handleSubcategoryChange(newSubcategory: string) {
    onChange(index, item.category, newSubcategory || null)
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-3 border-b border-zinc-100 text-sm ${borderClass(item)} ${item.accepted ? 'opacity-60' : ''}`}>
      {/* Date */}
      <span className="font-mono text-zinc-400 text-xs w-24 shrink-0">{item.original.date}</span>

      {/* Narration */}
      <span className="flex-1 text-zinc-700 truncate min-w-0" title={item.original.narration}>
        {item.original.narration}
      </span>

      {/* Amount */}
      <span className={`font-mono text-xs w-24 text-right shrink-0 ${amount.colour}`}>
        {amount.text}
      </span>

      {/* Category */}
      <select
        value={item.category}
        onChange={e => handleCategoryChange(e.target.value)}
        className="w-44 shrink-0 border border-zinc-200 rounded-md px-2 py-1 text-sm font-sans text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="Uncategorised">Uncategorised</option>
        {DEFAULT_CATEGORIES.map(cat => (
          <option key={cat.name} value={cat.name}>{cat.name}</option>
        ))}
      </select>

      {/* Subcategory */}
      <select
        value={item.subcategory ?? ''}
        onChange={e => handleSubcategoryChange(e.target.value)}
        disabled={subcategories.length === 0}
        className="w-44 shrink-0 border border-zinc-200 rounded-md px-2 py-1 text-sm font-sans text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <option value="">No subcategory</option>
        {subcategories.map(sub => (
          <option key={sub} value={sub}>{sub}</option>
        ))}
      </select>

      {/* Confidence badge */}
      <div className="w-16 shrink-0 text-right">
        <ConfidenceBadge item={item} />
      </div>
    </div>
  )
}
