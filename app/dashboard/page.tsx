'use client'

import { useMemo, useState } from 'react'
import { useHistoryStore } from '@/lib/store/history'
import Spinner from '@/components/Spinner'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

type Period = 'This month' | 'Last month' | 'Last 3 months' | 'All time' | 'Custom'
type GroupBy = 'Day' | 'Week' | 'Month' | 'Quarter' | 'Year'

function getPeriodBounds(period: Period): { from: string; to: string } | null {
  const now = new Date()
  if (period === 'This month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
    return { from, to }
  }
  if (period === 'Last month') {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10)
    const to = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10)
    return { from, to }
  }
  if (period === 'Last 3 months') {
    const from = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().slice(0, 10)
    const to = now.toISOString().slice(0, 10)
    return { from, to }
  }
  return null
}

function getGroupKey(date: string, groupBy: GroupBy): string {
  const d = new Date(date + 'T00:00:00')
  if (groupBy === 'Day') return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
  if (groupBy === 'Week') {
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d)
    monday.setDate(diff)
    return `Week of ${monday.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`
  }
  if (groupBy === 'Month') return d.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
  if (groupBy === 'Quarter') {
    const q = Math.floor(d.getMonth() / 3) + 1
    return `Q${q} ${d.getFullYear()}`
  }
  return String(d.getFullYear())
}

function getSortKey(date: string, groupBy: GroupBy): string {
  const d = new Date(date + 'T00:00:00')
  if (groupBy === 'Day') return date
  if (groupBy === 'Week') {
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d)
    monday.setDate(diff)
    return monday.toISOString().slice(0, 10)
  }
  if (groupBy === 'Month') return date.slice(0, 7)
  if (groupBy === 'Quarter') {
    const q = Math.floor(d.getMonth() / 3) + 1
    return `${d.getFullYear()}-Q${q}`
  }
  return String(d.getFullYear())
}

function fmt(n: number) {
  return n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })
}

export default function DashboardPage() {
  const { transactions, loaded: historyLoaded } = useHistoryStore()
  const [period, setPeriod] = useState<Period>('This month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [groupBy, setGroupBy] = useState<GroupBy>('Month')
  const [timeTab, setTimeTab] = useState<'Spending' | 'Income' | 'All'>('Spending')

  const periodTxs = useMemo(() => {
    if (period === 'Custom') {
      let result = transactions
      if (customFrom) result = result.filter(tx => tx.date >= customFrom)
      if (customTo) result = result.filter(tx => tx.date <= customTo)
      return result
    }
    const bounds = getPeriodBounds(period)
    if (!bounds) return transactions
    return transactions.filter(tx => tx.date >= bounds.from && tx.date <= bounds.to)
  }, [transactions, period, customFrom, customTo])

  const spendingTxs = useMemo(() => periodTxs.filter(tx => tx.debit != null), [periodTxs])
  const incomeTxs = useMemo(() => periodTxs.filter(tx => tx.credit != null), [periodTxs])

  const totalSpent = spendingTxs.reduce((sum, tx) => sum + (tx.debit ?? 0), 0)
  const totalIncome = incomeTxs.reduce((sum, tx) => sum + (tx.credit ?? 0), 0)
  const net = totalIncome - totalSpent

  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    spendingTxs.forEach(tx => {
      const cat = tx.category || 'Uncategorised'
      map.set(cat, (map.get(cat) ?? 0) + (tx.debit ?? 0))
    })
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amount]) => ({ cat, amount, pct: totalSpent > 0 ? (amount / totalSpent) * 100 : 0 }))
  }, [spendingTxs, totalSpent])

  const byPeriod = useMemo(() => {
    const map = new Map<string, { label: string; sortKey: string; amount: number }>()
    spendingTxs.forEach(tx => {
      const label = getGroupKey(tx.date, groupBy)
      const sortKey = getSortKey(tx.date, groupBy)
      const existing = map.get(label)
      map.set(label, { label, sortKey, amount: (existing?.amount ?? 0) + (tx.debit ?? 0) })
    })
    return Array.from(map.values()).sort((a, b) => b.sortKey.localeCompare(a.sortKey))
  }, [spendingTxs, groupBy])

  const byPeriodIncome = useMemo(() => {
    const map = new Map<string, { label: string; sortKey: string; amount: number }>()
    incomeTxs.forEach(tx => {
      const label = getGroupKey(tx.date, groupBy)
      const sortKey = getSortKey(tx.date, groupBy)
      const existing = map.get(label)
      map.set(label, { label, sortKey, amount: (existing?.amount ?? 0) + (tx.credit ?? 0) })
    })
    return Array.from(map.values()).sort((a, b) => b.sortKey.localeCompare(a.sortKey))
  }, [incomeTxs, groupBy])

  const largestTransactions = useMemo(() => {
    const map = new Map<string, number>()
    spendingTxs.forEach(tx => {
      map.set(tx.narration, (map.get(tx.narration) ?? 0) + (tx.debit ?? 0))
    })
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10)
  }, [spendingTxs])

  const popularMerchants = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>()
    spendingTxs.forEach(tx => {
      const existing = map.get(tx.narration)
      map.set(tx.narration, {
        count: (existing?.count ?? 0) + 1,
        total: (existing?.total ?? 0) + (tx.debit ?? 0),
      })
    })
    return Array.from(map.entries())
      .map(([narration, { count, total }]) => ({ narration, count, total }))
      .sort((a, b) => b.count - a.count || b.total - a.total)
      .slice(0, 10)
  }, [spendingTxs])

  const byPeriodAll = useMemo(() => {
    const map = new Map<string, { label: string; sortKey: string; spending: number; income: number }>()
    spendingTxs.forEach(tx => {
      const label = getGroupKey(tx.date, groupBy)
      const sortKey = getSortKey(tx.date, groupBy)
      const existing = map.get(label)
      map.set(label, { label, sortKey, spending: (existing?.spending ?? 0) + (tx.debit ?? 0), income: existing?.income ?? 0 })
    })
    incomeTxs.forEach(tx => {
      const label = getGroupKey(tx.date, groupBy)
      const sortKey = getSortKey(tx.date, groupBy)
      const existing = map.get(label)
      map.set(label, { label, sortKey, spending: existing?.spending ?? 0, income: (existing?.income ?? 0) + (tx.credit ?? 0) })
    })
    return Array.from(map.values()).sort((a, b) => b.sortKey.localeCompare(a.sortKey))
  }, [spendingTxs, incomeTxs, groupBy])

  const empty = transactions.length === 0

  if (!historyLoaded) return <Spinner />

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h1 className="text-xl font-semibold text-zinc-900">Dashboard</h1>
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Period</label>
              <select
                value={period}
                onChange={e => setPeriod(e.target.value as Period)}
                className="border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-600"
              >
                <option>This month</option>
                <option>Last month</option>
                <option>Last 3 months</option>
                <option>All time</option>
                <option>Custom</option>
              </select>
            </div>
            {period === 'Custom' && (
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Date range</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={customFrom}
                    onChange={e => setCustomFrom(e.target.value)}
                    className="border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                  <span className="text-xs text-zinc-400">to</span>
                  <input
                    type="date"
                    value={customTo}
                    onChange={e => setCustomTo(e.target.value)}
                    className="border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Group by</label>
              <select
                value={groupBy}
                onChange={e => setGroupBy(e.target.value as GroupBy)}
                className="border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-600"
              >
                <option>Day</option>
                <option>Week</option>
                <option>Month</option>
                <option>Quarter</option>
                <option>Year</option>
              </select>
            </div>
          </div>
        </div>

        {empty ? (
          <div className="bg-white rounded-xl border border-zinc-200 px-6 py-20 text-center text-sm text-zinc-400">
            No transactions yet. Upload a CSV to see your dashboard.
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl border border-zinc-200 p-5">
                <p className="text-xs font-medium text-zinc-500 mb-1">Total spent</p>
                <p className="text-2xl font-semibold text-red-600">{fmt(totalSpent)}</p>
              </div>
              <div className="bg-white rounded-xl border border-zinc-200 p-5">
                <p className="text-xs font-medium text-zinc-500 mb-1">Total income</p>
                <p className="text-2xl font-semibold" style={{ color: '#399605' }}>{fmt(totalIncome)}</p>
              </div>
              <div className="bg-white rounded-xl border border-zinc-200 p-5">
                <p className="text-xs font-medium text-zinc-500 mb-1">Net</p>
                <p className={`text-2xl font-semibold ${net < 0 ? 'text-red-600' : ''}`} style={net >= 0 ? { color: '#399605' } : undefined}>
                  {net >= 0 ? '+' : ''}{fmt(net)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Spending by category */}
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 mb-3">Spending by category</h2>
                {byCategory.length === 0 ? (
                  <div className="bg-white rounded-xl border border-zinc-200 px-5 py-10 text-center text-sm text-zinc-400">
                    No spending for this period.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {byCategory.map(({ cat, amount, pct }) => (
                      <div key={cat} className="bg-white rounded-xl border border-zinc-200 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-zinc-800 truncate">{cat}</span>
                          <span className="text-sm font-semibold text-zinc-900 ml-2 shrink-0">{fmt(amount)}</span>
                        </div>
                        <div className="w-full bg-zinc-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: '#399605' }} />
                        </div>
                        <p className="text-xs text-zinc-400 mt-1.5">{pct.toFixed(1)}% of total spending</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Spending / Income over time */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  {(['Spending', 'Income', 'All'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setTimeTab(tab)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        timeTab === tab
                          ? 'bg-zinc-900 border-zinc-900 text-white'
                          : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                  <span className="text-sm font-semibold text-zinc-900 ml-1">over time</span>
                </div>

                {timeTab === 'All' ? (
                  byPeriodAll.length === 0 ? (
                    <div className="bg-white rounded-xl border border-zinc-200 px-5 py-10 text-center text-sm text-zinc-400">
                      No transactions for this period.
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-zinc-200 p-4">
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart
                          data={[...byPeriodAll].reverse()}
                          margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#71717a' }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: '#71717a' }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                          <Tooltip
                            formatter={(value: number, name: string) => [fmt(value), name]}
                            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }}
                          />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Bar dataKey="spending" name="Spending" fill="#ef4444" radius={[3, 3, 0, 0]} />
                          <Bar dataKey="income" name="Income" fill="#399605" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )
                ) : (() => {
                  const rows = timeTab === 'Spending' ? byPeriod : byPeriodIncome
                  const isSpending = timeTab === 'Spending'
                  const colour = isSpending ? '#ef4444' : '#399605'
                  const dataKey = 'amount'
                  return rows.length === 0 ? (
                    <div className="bg-white rounded-xl border border-zinc-200 px-5 py-10 text-center text-sm text-zinc-400">
                      No {timeTab.toLowerCase()} for this period.
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-zinc-200 p-4">
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart
                          data={[...rows].reverse()}
                          margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#71717a' }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: '#71717a' }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                          <Tooltip
                            formatter={(value: number) => [fmt(value), timeTab]}
                            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }}
                          />
                          <Bar dataKey={dataKey} name={timeTab} fill={colour} radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )
                })()}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Largest transactions */}
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 mb-3">Largest transactions</h2>
                {largestTransactions.length === 0 ? (
                  <div className="bg-white rounded-xl border border-zinc-200 px-5 py-10 text-center text-sm text-zinc-400">
                    No spending for this period.
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200 bg-zinc-50">
                          <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 w-10">#</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Merchant</th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500">Total spent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {largestTransactions.map(([merchant, amount], i) => (
                          <tr key={merchant} className="border-b border-zinc-100 last:border-0">
                            <td className="px-4 py-3 text-zinc-400 tabular-nums">{i + 1}</td>
                            <td className="px-4 py-3 text-zinc-900">{merchant}</td>
                            <td className="px-4 py-3 text-right font-medium text-red-600 tabular-nums">{fmt(amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Popular merchants */}
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 mb-3">Popular merchants</h2>
                {popularMerchants.length === 0 ? (
                  <div className="bg-white rounded-xl border border-zinc-200 px-5 py-10 text-center text-sm text-zinc-400">
                    No spending for this period.
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200 bg-zinc-50">
                          <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 w-10">#</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Merchant</th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500">Times</th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {popularMerchants.map(({ narration, count, total }, i) => (
                          <tr key={narration} className="border-b border-zinc-100 last:border-0">
                            <td className="px-4 py-3 text-zinc-400 tabular-nums">{i + 1}</td>
                            <td className="px-4 py-3 text-zinc-900">{narration}</td>
                            <td className="px-4 py-3 text-right text-zinc-500 tabular-nums">{count}</td>
                            <td className="px-4 py-3 text-right font-medium text-red-600 tabular-nums">{fmt(total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
