'use client'

import { useMemo } from 'react'
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

function getCurrentMonthBounds() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
  const label = now.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
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

function DonutLabel({ cx, cy, total }: { cx: number; cy: number; total: number }) {
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} dy="-0.5em" fontSize="13" fill="#71717a">Total spent</tspan>
      <tspan x={cx} dy="1.7em" fontSize="18" fontWeight="700" fill="#18181b">{fmt(total)}</tspan>
    </text>
  )
}

export default function HomePage() {
  const { transactions, loaded } = useHistoryStore()
  const { user } = useAuthStore()

  const { from, to, label } = getCurrentMonthBounds()

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
        <div className="w-full mb-8">
          <h1 className="text-2xl font-bold text-zinc-900">Hey, {firstName}.</h1>
          <p className="text-sm text-zinc-500 mt-1">{label}</p>
        </div>

        {/* Donut — hero */}
        {hasData ? (
          <div className="w-full bg-white border border-zinc-200 rounded-2xl p-8 mb-6">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Chart */}
              <div className="w-full lg:w-64 shrink-0" style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={byCategory}
                      dataKey="amount"
                      nameKey="cat"
                      innerRadius={75}
                      outerRadius={115}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {byCategory.map((entry) => (
                        <Cell key={entry.cat} fill={entry.colour} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={<DonutTooltip />}
                      wrapperStyle={{ zIndex: 50 }}
                    />
                    {byCategory.length > 0 && (
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                        <tspan x="50%" dy="-0.5em" fontSize="12" fill="#71717a">Total spent</tspan>
                        <tspan x="50%" dy="1.6em" fontSize="17" fontWeight="700" fill="#18181b">{fmt(totalSpent)}</tspan>
                      </text>
                    )}
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="flex-1 w-full">
                <ul className="space-y-2">
                  {byCategory.map(item => (
                    <li key={item.cat} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.colour }}
                        />
                        <span className="text-sm text-zinc-700 truncate">{item.cat}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-zinc-400">{item.pct.toFixed(1)}%</span>
                        <span className="text-sm font-medium text-zinc-900 tabular-nums">{fmt(item.amount)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full bg-white border border-zinc-200 rounded-2xl p-12 mb-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
              <span className="text-3xl">📂</span>
            </div>
            <p className="text-sm font-medium text-zinc-700 mb-1">No data for {label}</p>
            <p className="text-xs text-zinc-400">Upload a CSV to see your spending breakdown.</p>
          </div>
        )}

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
