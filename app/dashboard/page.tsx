'use client'

import { useMemo, useState } from 'react'
import { useHistoryStore } from '@/lib/store/history'
import Spinner from '@/components/Spinner'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts'
import type { Transaction } from '@/lib/normaliser/types'

type Period = 'This month' | 'Last month' | 'Last 3 months' | 'All time' | 'Custom'
type GroupBy = 'Day' | 'Week' | 'Month' | 'Quarter' | 'Year'

const CATEGORY_COLOURS = [
  '#a3c14a',
  '#5a6c37',
  '#ffc888',
  '#d103d1',
  '#633058',
  '#fb92ff',
  '#7a9e3b',
  '#3d4f22',
  '#e8d44d',
  '#a002a0',
  '#8b4a78',
  '#fdb8fe',
]

const UNCATEGORISED_COLOUR = '#a9acb6'

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

function getMonthBounds(yearMonth: string): { from: string; to: string } {
  const [y, m] = yearMonth.split('-').map(Number)
  const from = new Date(y, m - 1, 1).toISOString().slice(0, 10)
  const to = new Date(y, m, 0).toISOString().slice(0, 10)
  return { from, to }
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

function getCurrentYearMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function getPrevYearMonth(ym: string) {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatYearMonth(ym: string) {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
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

export default function DashboardPage() {
  const { transactions, loaded: historyLoaded } = useHistoryStore()
  const [period, setPeriod] = useState<Period>('This month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [groupBy, setGroupBy] = useState<GroupBy>('Month')
  const [timeTab, setTimeTab] = useState<'Spending' | 'Income' | 'All'>('Spending')

  // Drilldown panel
  const [drillCategory, setDrillCategory] = useState<string | null>(null)

  // Month-over-month
  const [momMonth1, setMomMonth1] = useState(getPrevYearMonth(getCurrentYearMonth()))
  const [momMonth2, setMomMonth2] = useState(getCurrentYearMonth())

  // Collapsed sections
  const [largestExpanded, setLargestExpanded] = useState(false)
  const [popularExpanded, setPopularExpanded] = useState(false)

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
      .map(([cat, amount], i) => ({
        cat,
        amount,
        pct: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
        colour: cat === 'Uncategorised' ? UNCATEGORISED_COLOUR : CATEGORY_COLOURS[i % CATEGORY_COLOURS.length],
      }))
  }, [spendingTxs, totalSpent])

  const categoryColourMap = useMemo(() => {
    const map = new Map<string, string>()
    byCategory.forEach(({ cat, colour }) => map.set(cat, colour))
    return map
  }, [byCategory])

  // Drilldown transactions
  const drillTxs = useMemo<Transaction[]>(() => {
    if (!drillCategory) return []
    return spendingTxs.filter(tx => (tx.category || 'Uncategorised') === drillCategory)
      .sort((a, b) => (b.debit ?? 0) - (a.debit ?? 0))
  }, [drillCategory, spendingTxs])

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

  // Month-over-month data
  const momData = useMemo(() => {
    const b1 = getMonthBounds(momMonth1)
    const b2 = getMonthBounds(momMonth2)
    const m1Txs = transactions.filter(tx => tx.debit != null && tx.date >= b1.from && tx.date <= b1.to)
    const m2Txs = transactions.filter(tx => tx.debit != null && tx.date >= b2.from && tx.date <= b2.to)
    const cats = new Set<string>()
    m1Txs.forEach(tx => cats.add(tx.category || 'Uncategorised'))
    m2Txs.forEach(tx => cats.add(tx.category || 'Uncategorised'))
    return Array.from(cats).map(cat => {
      const m1 = m1Txs.filter(tx => (tx.category || 'Uncategorised') === cat).reduce((s, tx) => s + (tx.debit ?? 0), 0)
      const m2 = m2Txs.filter(tx => (tx.category || 'Uncategorised') === cat).reduce((s, tx) => s + (tx.debit ?? 0), 0)
      return { cat, [momMonth1]: m1, [momMonth2]: m2 }
    }).sort((a, b) => (b[momMonth2] as number) - (a[momMonth2] as number))
  }, [transactions, momMonth1, momMonth2])

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
                  <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                    className="border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-600" />
                  <span className="text-xs text-zinc-400">to</span>
                  <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                    className="border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-600" />
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
            {/* Summary cards */}
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

            {/* Row 1: Donut + Over time */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

              {/* Donut chart */}
              <div className="bg-white rounded-xl border border-zinc-200 p-5">
                <h2 className="text-sm font-semibold text-zinc-900 mb-4">Spending by category</h2>
                {byCategory.length === 0 ? (
                  <p className="text-sm text-zinc-400 text-center py-10">No spending for this period.</p>
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
                        <Tooltip
                          content={<DonutTooltip />}
                          wrapperStyle={{ zIndex: 50 }}
                        />
                        <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" fontSize={12} fill="#71717a">Total spent</text>
                        <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" fontSize={15} fontWeight={700} fill="#18181b">{fmt(totalSpent)}</text>
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Legend */}
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
                    {drillCategory && (
                      <p className="text-xs text-zinc-400 text-center">
                        Click a category to drill down — or click again to deselect
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Over time */}
              <div className="bg-white rounded-xl border border-zinc-200 p-5">
                <div className="flex items-center gap-2 mb-4">
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
                    <p className="text-sm text-zinc-400 text-center py-10">No transactions for this period.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={[...byPeriodAll].reverse()} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#71717a' }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#71717a' }} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`} />
                        <Tooltip formatter={(value) => [fmt(Number(value ?? 0)), '']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="spending" name="Spending" fill="#ef4444" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="income" name="Income" fill="#399605" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )
                ) : (() => {
                  const rows = timeTab === 'Spending' ? byPeriod : byPeriodIncome
                  const colour = timeTab === 'Spending' ? '#ef4444' : '#399605'
                  return rows.length === 0 ? (
                    <p className="text-sm text-zinc-400 text-center py-10">No {timeTab.toLowerCase()} for this period.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={[...rows].reverse()} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#71717a' }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#71717a' }} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`} />
                        <Tooltip formatter={(value) => [fmt(Number(value ?? 0)), timeTab]} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }} />
                        <Bar dataKey="amount" name={timeTab} fill={colour} radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )
                })()}
              </div>
            </div>

            {/* Row 2: Month-over-month */}
            <div className="bg-white rounded-xl border border-zinc-200 p-5 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h2 className="text-sm font-semibold text-zinc-900">Month-over-month spending</h2>
                <div className="flex items-center gap-2">
                  <input
                    type="month"
                    value={momMonth1}
                    onChange={e => setMomMonth1(e.target.value)}
                    className="border border-zinc-300 rounded-lg px-3 py-1.5 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                  <span className="text-xs text-zinc-400">vs</span>
                  <input
                    type="month"
                    value={momMonth2}
                    onChange={e => setMomMonth2(e.target.value)}
                    className="border border-zinc-300 rounded-lg px-3 py-1.5 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>
              </div>
              {momData.length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-10">No spending data for these months.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={momData} margin={{ top: 4, right: 8, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="cat" tick={{ fontSize: 11, fill: '#71717a' }} tickLine={false} axisLine={false} angle={-35} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 11, fill: '#71717a' }} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`} />
                    <Tooltip formatter={(value) => [fmt(Number(value ?? 0)), '']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }} />
                    <Legend
                      verticalAlign="top"
                      wrapperStyle={{ fontSize: 12, paddingBottom: 12 }}
                      payload={[
                        { value: formatYearMonth(momMonth1), type: 'square', color: '#7B9E3B' },
                        { value: formatYearMonth(momMonth2), type: 'square', color: '#ffc888' },
                      ]}
                    />
                    <Bar dataKey={momMonth1} name={formatYearMonth(momMonth1)} fill="#7B9E3B" radius={[3, 3, 0, 0]} />
                    <Bar dataKey={momMonth2} name={formatYearMonth(momMonth2)} fill="#ffc888" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Row 3: Largest transactions + Popular merchants (collapsible) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Largest transactions */}
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <button
                  onClick={() => setLargestExpanded(v => !v)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-zinc-50 transition-colors"
                >
                  <h2 className="text-sm font-semibold text-zinc-900">Largest transactions</h2>
                  <span className="text-zinc-400 text-sm">{largestExpanded ? '▲' : '▼'}</span>
                </button>
                {largestExpanded && (
                  largestTransactions.length === 0 ? (
                    <p className="px-5 pb-5 text-sm text-zinc-400">No spending for this period.</p>
                  ) : (
                    <table className="w-full text-sm border-t border-zinc-100">
                      <thead>
                        <tr className="bg-zinc-50">
                          <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 w-10">#</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Merchant</th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500">Total spent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {largestTransactions.map(([merchant, amount], i) => (
                          <tr key={merchant} className="border-t border-zinc-100">
                            <td className="px-4 py-3 text-zinc-400 tabular-nums">{i + 1}</td>
                            <td className="px-4 py-3 text-zinc-900">{merchant}</td>
                            <td className="px-4 py-3 text-right font-medium text-red-600 tabular-nums">{fmt(amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
                )}
              </div>

              {/* Popular merchants */}
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <button
                  onClick={() => setPopularExpanded(v => !v)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-zinc-50 transition-colors"
                >
                  <h2 className="text-sm font-semibold text-zinc-900">Popular merchants</h2>
                  <span className="text-zinc-400 text-sm">{popularExpanded ? '▲' : '▼'}</span>
                </button>
                {popularExpanded && (
                  popularMerchants.length === 0 ? (
                    <p className="px-5 pb-5 text-sm text-zinc-400">No spending for this period.</p>
                  ) : (
                    <table className="w-full text-sm border-t border-zinc-100">
                      <thead>
                        <tr className="bg-zinc-50">
                          <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 w-10">#</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Merchant</th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500">Times</th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {popularMerchants.map(({ narration, count, total }, i) => (
                          <tr key={narration} className="border-t border-zinc-100">
                            <td className="px-4 py-3 text-zinc-400 tabular-nums">{i + 1}</td>
                            <td className="px-4 py-3 text-zinc-900">{narration}</td>
                            <td className="px-4 py-3 text-right text-zinc-500 tabular-nums">{count}</td>
                            <td className="px-4 py-3 text-right font-medium text-red-600 tabular-nums">{fmt(total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Category drilldown slide-out panel */}
      {drillCategory && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-30"
            onClick={() => setDrillCategory(null)}
          />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-40 flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200">
              <div className="flex items-center gap-3">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ background: categoryColourMap.get(drillCategory) ?? '#2d6a4f' }}
                />
                <h2 className="text-base font-semibold text-zinc-900">{drillCategory}</h2>
              </div>
              <button
                onClick={() => setDrillCategory(null)}
                className="text-zinc-400 hover:text-zinc-700 transition-colors text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50">
              <p className="text-xs text-zinc-500">{drillTxs.length} transaction{drillTxs.length !== 1 ? 's' : ''}</p>
              <p className="text-xl font-semibold text-zinc-900">
                {fmt(drillTxs.reduce((s, tx) => s + (tx.debit ?? 0), 0))}
              </p>
            </div>
            <div className="overflow-y-auto flex-1">
              {drillTxs.map(tx => (
                <div key={tx.id} className="flex items-center justify-between px-6 py-3 border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <div className="min-w-0 flex-1 pr-4">
                    <p className="text-sm text-zinc-900 truncate">{tx.narration}</p>
                    <p className="text-xs text-zinc-400">{tx.date}</p>
                  </div>
                  <p className="text-sm font-medium text-red-600 tabular-nums shrink-0">{fmt(tx.debit ?? 0)}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  )
}
