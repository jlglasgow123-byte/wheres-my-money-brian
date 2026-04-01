'use client'

import { useState } from 'react'

interface Props {
  count: number
  onProceed: (suppress: boolean) => void
  onCancel: () => void
}

export default function UncatWarningModal({ count, onProceed, onCancel }: Props) {
  const [suppress, setSuppress] = useState(false)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-base font-semibold text-zinc-900 mb-2">Uncategorised transactions</h2>
        <p className="text-sm text-zinc-600 mb-5">
          You still have{' '}
          <span className="font-medium text-zinc-900">
            {count} transaction{count !== 1 ? 's' : ''}
          </span>{' '}
          that {count !== 1 ? 'have' : 'has'} not been categorised. Do you wish to proceed?
        </p>

        <label className="flex items-center gap-2 mb-5 cursor-pointer">
          <input
            type="checkbox"
            checked={suppress}
            onChange={e => setSuppress(e.target.checked)}
            className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-zinc-500">Don&apos;t show me this message again</span>
        </label>

        <div className="flex gap-3">
          <button
            onClick={() => onProceed(suppress)}
            className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Yes, proceed
          </button>
          <button
            onClick={onCancel}
            className="flex-1 border border-zinc-300 text-zinc-600 text-sm font-medium py-2 px-4 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            No, go back
          </button>
        </div>
      </div>
    </div>
  )
}
