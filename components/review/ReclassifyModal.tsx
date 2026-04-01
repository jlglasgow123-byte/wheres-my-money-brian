import { useState } from 'react'
import type { MatchType } from '@/lib/categoriser/types'

interface Props {
  narration: string
  toCategory: string
  toSubcategory: string | null
  current?: number
  onSaveRule: (matchType: MatchType, caseSensitive: boolean) => void
  onSkipRule: () => void
}

const MATCH_LABELS: Record<MatchType, string> = {
  contains: 'Contains',
  starts_with: 'Starts with',
  ends_with: 'Ends with',
}

export default function ReclassifyModal({ narration, toCategory, toSubcategory, current, onSaveRule, onSkipRule }: Props) {
  const [matchType, setMatchType] = useState<MatchType>('contains')
  const [caseSensitive, setCaseSensitive] = useState(false)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-zinc-900">Save this mapping?</h2>
          {current !== undefined && (
            <span className="text-xs text-zinc-400">{current} remaining</span>
          )}
        </div>
        <p className="text-sm text-zinc-500 mb-4">
          Would you like to permanently save this as a rule so future uploads are categorised the same way?
        </p>

        <div className="bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 mb-4 text-sm">
          <p className="font-mono text-zinc-600 text-xs mb-1 truncate">{narration}</p>
          <p className="text-zinc-900 font-medium">
            {toCategory}
            {toSubcategory && <span className="text-zinc-500 font-normal"> / {toSubcategory}</span>}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-end mb-5">
          <div className="flex flex-col gap-1 flex-1 min-w-32">
            <label className="text-xs text-zinc-500 font-medium">Match type</label>
            <select
              value={matchType}
              onChange={e => setMatchType(e.target.value as MatchType)}
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
                checked={caseSensitive}
                onChange={e => setCaseSensitive(e.target.checked)}
                className="accent-blue-600 w-4 h-4"
              />
              <span className="text-sm text-zinc-600">Case-sensitive</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => onSaveRule(matchType, caseSensitive)}
            className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Yes, save as rule
          </button>
          <button
            onClick={onSkipRule}
            className="flex-1 border border-zinc-300 text-zinc-600 text-sm font-medium py-2 px-4 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            This upload only
          </button>
        </div>
      </div>
    </div>
  )
}
