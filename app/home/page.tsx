'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useHistoryStore } from '@/lib/store/history'
import { useAuthStore } from '@/lib/store/auth'
import Spinner from '@/components/Spinner'

const CATEGORY_COLOURS = [
  '#a3c14a', '#5a6c37', '#ffc888', '#d103d1', '#633058',
  '#fb92ff', '#7a9e3b', '#3d4f22', '#e8d44d', '#a002a0',
  '#8b4a78', '#fdb8fe',
]
const UNCATEGORISED_COLOUR = '#a9acb6'

function fmt(n: number) {
  return n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })
}

function getLastMonthBounds() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10)
  const to = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10)
  const label = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    .toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
  return { from, to, label }
}

function DonutTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { cat: string; amount: number } }> }) {
  if (!active || !payload?.length) return null
  const { cat, amount } = payload[0].payload
  return (
    <div className="bg-white border border-zinc-200 rounded-lg shadow-md px-3 py-2 text-xs pointer-events-none">
      <p className="font-semibold text-black mb-0.5">{cat}</p>
      <p className="text-black">{fmt(amount)}</p>
    </div>
  )
}

export default function HomePage() {
  const { transactions, loaded } = useHistoryStore()
  const { user } = useAuthStore()
  const [drillCategory, setDrillCategory] = useState<string | null>(null)

  const { from, to, label } = getLastMonthBounds()

  const monthTxs = useMemo(
    () => transactions.filter(tx => tx.date >= from && tx.date <= to && tx.debit != null),
    [transactions, from, to]
  )

  const totalSpent = useMemo(
    () => monthTxs.reduce((sum, tx) => sum + (tx.debit ?? 0), 0),
    [monthTxs]
  )

  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    monthTxs.forEach(tx => {
      const cat = tx.category || 'Uncategorised'
      map.set(cat, (map.get(cat) ?? 0) + (tx.debit ?? 0))
    })
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amount], i) => ({
        cat,
        amount,
        pct: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
        colour: cat === 'Uncategorised' ? UNCATEGORISED_COLOUR : CATEGORY_COLOURS[i % CATEGORY_COLOURS.length],
      }))
  }, [monthTxs, totalSpent])

  if (!loaded) return <Spinner />

  const firstName = user?.email?.split('@')[0] ?? 'there'
  const hasData = monthTxs.length > 0

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10">
      <div className="max-w-2xl mx-auto flex flex-col items-center">

        {/* Greeting */}
        <div className="w-full mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">Hey, {firstName}.</h1>
          <p className="text-sm text-zinc-500 mt-1">{label}</p>
        </div>

        {/* Donut — hero */}
        <div className="w-full bg-white rounded-xl border border-zinc-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-zinc-900 mb-4">Spending by category</h2>
          {!hasData ? (
            <div className="flex flex-col items-center text-center py-10">
              <p className="text-sm font-medium text-zinc-500 mb-1">No data for {label}</p>
              <p className="text-xs text-zinc-400">Upload a CSV to see your spending breakdown.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={byCategory}
                    dataKey="amount"
                    nameKey="cat"
                    cx="50%"
                    cy="50%"
                    innerRadius={72}
                    outerRadius={105}
                    paddingAngle={2}
                    onClick={(d) => { const cat = (d as unknown as { cat: string }).cat; setDrillCategory(cat === drillCategory ? null : cat) }}
                    style={{ cursor: 'pointer' }}
                  >
                    {byCategory.map(({ cat, colour }) => (
                      <Cell
                        key={cat}
                        fill={colour}
                        opacity={drillCategory && drillCategory !== cat ? 0.35 : 1}
                        stroke={drillCategory === cat ? '#fff' : 'none'}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} wrapperStyle={{ zIndex: 50 }} />
                  <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" fontSize={12} fill="#71717a">Total spent</text>
                  <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" fontSize={15} fontWeight={700} fill="#18181b">{fmt(totalSpent)}</text>
                </PieChart>
              </ResponsiveContainer>

              {/* Legend — 2 columns, clickable */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {byCategory.map(({ cat, amount, pct, colour }) => (
                  <button
                    key={cat}
                    onClick={() => setDrillCategory(cat === drillCategory ? null : cat)}
                    className={`flex items-center gap-2 text-left rounded-lg px-2 py-1 transition-colors ${drillCategory === cat ? 'bg-zinc-100' : 'hover:bg-zinc-50'}`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colour }} />
                    <span className="text-xs text-zinc-700 truncate flex-1">{cat}</span>
                    <span className="text-xs text-zinc-400 shrink-0">{pct.toFixed(0)}%</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/"
            className="flex flex-col items-center gap-2 bg-white border border-zinc-200 rounded-xl px-4 py-5 hover:border-[#399605] hover:shadow-sm transition-all group"
          >
            <span className="text-xl">⬆️</span>
            <span className="text-sm font-medium text-zinc-700 group-hover:text-[#399605] transition-colors">Upload CSV</span>
          </Link>
          <Link
            href="/rules"
            className="flex flex-col items-center gap-2 bg-white border border-zinc-200 rounded-xl px-4 py-5 hover:border-[#399605] hover:shadow-sm transition-all group"
          >
            <span className="text-xl">⚙️</span>
            <span className="text-sm font-medium text-zinc-700 group-hover:text-[#399605] transition-colors">Update Rules</span>
          </Link>
          <Link
            href="/dashboard"
            className="flex flex-col items-center gap-2 bg-white border border-zinc-200 rounded-xl px-4 py-5 hover:border-[#399605] hover:shadow-sm transition-all group"
          >
            <span className="text-xl">📊</span>
            <span className="text-sm font-medium text-zinc-700 group-hover:text-[#399605] transition-colors">View Dashboard</span>
          </Link>
        </div>

      </div>
    </main>
  )
}
