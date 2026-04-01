import type { Transaction } from '@/lib/normaliser/types'

interface Props {
  transactions: Transaction[]
}

export default function CategoryInspector({ transactions }: Props) {
  const categorised = transactions.filter(tx => tx.category !== 'Uncategorised' && !tx.conflict)
  const conflicts = transactions.filter(tx => tx.conflict)
  const uncategorised = transactions.filter(tx => tx.category === 'Uncategorised' && !tx.conflict)

  return (
    <div className="border border-zinc-200 rounded-lg overflow-hidden text-xs">
      <div className="bg-zinc-100 px-3 py-2 font-semibold text-zinc-700 font-mono">
        Phase 4 — Categorisation Inspector
      </div>

      {/* Categorised */}
      <section>
        <div className="px-3 py-1.5 bg-green-50 border-b border-zinc-200 font-medium text-green-800">
          Categorised ({categorised.length})
        </div>
        {categorised.length === 0 ? (
          <p className="px-3 py-2 text-zinc-400 italic">None</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100 text-zinc-500">
                <th className="px-3 py-1.5 text-left font-medium">Date</th>
                <th className="px-3 py-1.5 text-left font-medium">Narration</th>
                <th className="px-3 py-1.5 text-left font-medium">Category</th>
                <th className="px-3 py-1.5 text-left font-medium">Subcategory</th>
                <th className="px-3 py-1.5 text-left font-medium">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {categorised.map((tx, i) => (
                <tr key={i} className="border-b border-zinc-50 odd:bg-white even:bg-zinc-50">
                  <td className="px-3 py-1.5 font-mono text-zinc-500">{tx.date}</td>
                  <td className="px-3 py-1.5 text-zinc-700 max-w-[200px] truncate">{tx.narration}</td>
                  <td className="px-3 py-1.5 text-zinc-900 font-medium">{tx.category}</td>
                  <td className="px-3 py-1.5 text-zinc-500">{tx.subcategory ?? '—'}</td>
                  <td className="px-3 py-1.5">
                    <ConfidenceBadge value={tx.confidence} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Conflicts */}
      <section>
        <div className="px-3 py-1.5 bg-red-50 border-y border-zinc-200 font-medium text-red-800">
          Conflicts ({conflicts.length})
        </div>
        {conflicts.length === 0 ? (
          <p className="px-3 py-2 text-zinc-400 italic">None</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100 text-zinc-500">
                <th className="px-3 py-1.5 text-left font-medium">Date</th>
                <th className="px-3 py-1.5 text-left font-medium">Narration</th>
              </tr>
            </thead>
            <tbody>
              {conflicts.map((tx, i) => (
                <tr key={i} className="border-b border-zinc-50 odd:bg-white even:bg-red-50">
                  <td className="px-3 py-1.5 font-mono text-zinc-500">{tx.date}</td>
                  <td className="px-3 py-1.5 text-zinc-700">{tx.narration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Uncategorised */}
      <section>
        <div className="px-3 py-1.5 bg-zinc-50 border-t border-zinc-200 font-medium text-zinc-600">
          Uncategorised ({uncategorised.length})
        </div>
        {uncategorised.length === 0 ? (
          <p className="px-3 py-2 text-zinc-400 italic">None</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100 text-zinc-500">
                <th className="px-3 py-1.5 text-left font-medium">Date</th>
                <th className="px-3 py-1.5 text-left font-medium">Narration</th>
              </tr>
            </thead>
            <tbody>
              {uncategorised.map((tx, i) => (
                <tr key={i} className="border-b border-zinc-50 odd:bg-white even:bg-zinc-50">
                  <td className="px-3 py-1.5 font-mono text-zinc-500">{tx.date}</td>
                  <td className="px-3 py-1.5 text-zinc-700">{tx.narration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

function ConfidenceBadge({ value }: { value: 'High' | 'Medium' | 'Low' | null }) {
  if (!value) return <span className="text-zinc-300">—</span>
  const styles = {
    High: 'bg-green-100 text-green-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    Low: 'bg-red-100 text-red-800',
  }
  return (
    <span className={`px-1.5 py-0.5 rounded font-medium ${styles[value]}`}>
      {value}
    </span>
  )
}
