'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useHistoryStore } from '@/lib/store/history'
import { useAuthStore } from '@/lib/store/auth'
import Spinner from '@/components/Spinner'

const COLOURS = ['#a3c14a', '#5a6c37', '#ffc888', '#d103d1', '#633058', '#fb92ff', '#7a9e3b', '#3d4f22', '#e8d44d']
const SUBSCRIPTION_KEYWORDS = ['NETFLIX', 'SPOTIFY', 'DISNEY', 'APPLE TV', 'STAN', 'FOXTEL', 'AUDIBLE', 'AMAZON PRIME', 'YOUTUBE PREMIUM', 'OPTUS']

function fmt(n: number) {
  return n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 })
}
function fmtExact(n: number) {
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

function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { cat: string; amount: number } }> }) {
  if (!active || !payload?.length) return null
  const { cat, amount } = payload[0].payload
  return (
    <div className="bg-white border border-zinc-200 rounded-lg shadow px-3 py-2 text-xs pointer-events-none">
      <p className="font-semibold text-zinc-900 mb-0.5">{cat}</p>
      <p className="text-zinc-600">{fmtExact(amount)}</p>
    </div>
  )
}

export default function DemoPage() {
  const { transactions, loaded } = useHistoryStore()
  const { isDemoMode } = useAuthStore()
  const { from, to, label } = getLastMonthBounds()

  const monthDebits = useMemo(
    () => transactions.filter(tx => tx.date >= from && tx.date <= to && tx.debit != null),
    [transactions, from, to]
  )

  const totalSpent = useMemo(
    () => monthDebits.reduce((sum, tx) => sum + (tx.debit ?? 0), 0),
    [monthDebits]
  )

  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    monthDebits.forEach(tx => {
      const cat = tx.category || 'Uncategorised'
      if (cat === 'Income') return
      map.set(cat, (map.get(cat) ?? 0) + (tx.debit ?? 0))
    })
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amount]) => ({ cat, amount }))
  }, [monthDebits])

  const topCategory = byCategory[0] ?? null
  const secondCategory = byCategory[1] ?? null

  // Uber: rides + eats
  const uberTxs = useMemo(
    () => monthDebits.filter(tx => tx.narration.toUpperCase().includes('UBER')),
    [monthDebits]
  )
  const uberTotal = uberTxs.reduce((sum, tx) => sum + (tx.debit ?? 0), 0)
  const uberRides = uberTxs.filter(tx => !tx.narration.toUpperCase().includes('EATS'))
  const uberEats = uberTxs.filter(tx => tx.narration.toUpperCase().includes('EATS'))

  // Dining total
  const diningTotal = useMemo(
    () => monthDebits
      .filter(tx => tx.category === 'Dining & Takeaway')
      .reduce((sum, tx) => sum + (tx.debit ?? 0), 0),
    [monthDebits]
  )

  // Subscriptions — unique by keyword, latest monthly cost
  const subSummary = useMemo(() => {
    const seen = new Set<string>()
    const result: { name: string; amount: number }[] = []
    const LABELS: Record<string, string> = {
      NETFLIX: 'Netflix', SPOTIFY: 'Spotify', DISNEY: 'Disney+',
      'APPLE TV': 'Apple TV+', STAN: 'Stan', FOXTEL: 'Foxtel',
      AUDIBLE: 'Audible', 'AMAZON PRIME': 'Amazon Prime',
      'YOUTUBE PREMIUM': 'YouTube Premium', OPTUS: 'Optus',
    }
    for (const tx of [...transactions].sort((a, b) => b.date.localeCompare(a.date))) {
      if (!tx.debit) continue
      const kw = SUBSCRIPTION_KEYWORDS.find(k => tx.narration.toUpperCase().includes(k))
      if (kw && !seen.has(kw)) {
        seen.add(kw)
        result.push({ name: LABELS[kw] ?? kw, amount: tx.debit })
      }
    }
    return result
  }, [transactions])

  const subTotal = subSummary.reduce((sum, s) => sum + s.amount, 0)

  if (!loaded) return <Spinner />

  const topNonHousing = byCategory.find(c => c.cat !== 'Housing') ?? null

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10">
      <div className="max-w-xl mx-auto flex flex-col gap-5">

        {/* ── A. Headline ──────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <p className="text-sm text-zinc-400 mb-1">{label}</p>
          <p className="text-3xl font-bold text-zinc-900 mb-1">
            You spent {fmt(totalSpent)} this month.
          </p>
          {isDemoMode && (
            <p className="text-xs text-zinc-400 mt-3">
              Demo data.{' '}
              <Link href="/signup" className="underline hover:text-zinc-600 transition-colors">
                Sign up free
              </Link>{' '}
              to see your real numbers.
            </p>
          )}
        </div>

        {/* ── B. Biggest category ───────────────────────────────────── */}
        {topCategory && (
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Biggest category</p>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xl font-bold text-zinc-900">{topCategory.cat}</p>
                <p className="text-sm text-zinc-500">
                  {Math.round((topCategory.amount / totalSpent) * 100)}% of your spending
                </p>
              </div>
              <p className="text-2xl font-bold text-zinc-900">{fmt(topCategory.amount)}</p>
            </div>
            {secondCategory && (
              <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
                <p className="text-sm text-zinc-500">Second biggest: {secondCategory.cat}</p>
                <p className="text-sm font-semibold text-zinc-700">{fmt(secondCategory.amount)}</p>
              </div>
            )}
          </div>
        )}

        {/* ── C. Money leaks ────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Money leaks</p>
          <div className="flex flex-col gap-3">

            {uberTotal > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-amber-900">Uber rides + Uber Eats</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      {uberRides.length} trips · {uberEats.length} deliveries
                    </p>
                  </div>
                  <p className="text-xl font-bold text-amber-900">{fmt(uberTotal)}</p>
                </div>
              </div>
            )}

            {diningTotal > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-orange-900">Dining, takeaway & cafes</p>
                    <p className="text-xs text-orange-700 mt-0.5">
                      {monthDebits.filter(tx => tx.category === 'Dining & Takeaway').length} transactions
                    </p>
                  </div>
                  <p className="text-xl font-bold text-orange-900">{fmt(diningTotal)}</p>
                </div>
              </div>
            )}

            {topNonHousing && topNonHousing.cat === 'Groceries' && (
              <div className="bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-zinc-800">Grocery bill</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {monthDebits.filter(tx => tx.category === 'Groceries').length} shops this month
                    </p>
                  </div>
                  <p className="text-xl font-bold text-zinc-900">{fmt(topNonHousing.amount)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── D. Subscriptions ──────────────────────────────────────── */}
        {subSummary.length > 0 && (
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                Subscriptions
              </p>
              <p className="text-sm font-bold text-zinc-900">{fmtExact(subTotal)}/month</p>
            </div>
            <div className="flex flex-col gap-2">
              {subSummary.map(s => (
                <div key={s.name} className="flex items-center justify-between">
                  <p className="text-sm text-zinc-700">{s.name}</p>
                  <p className="text-sm font-medium text-zinc-900">{fmtExact(s.amount)}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-zinc-400 mt-3 border-t border-zinc-100 pt-3">
              That&apos;s {fmtExact(subTotal * 12)} per year in subscriptions alone.
            </p>
          </div>
        )}

        {/* ── E. Spending breakdown (trends) ────────────────────────── */}
        {byCategory.length > 0 && (
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-4">Breakdown</p>
            <div className="flex flex-col gap-3">
              {byCategory.slice(0, 6).map(({ cat, amount }, i) => (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-zinc-700">{cat}</p>
                    <p className="text-sm font-semibold text-zinc-900">{fmt(amount)}</p>
                  </div>
                  <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(amount / byCategory[0].amount) * 100}%`,
                        background: COLOURS[i % COLOURS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── F. Chart ──────────────────────────────────────────────── */}
        {byCategory.length > 0 && (
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-4">Category breakdown</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={byCategory}
                  dataKey="amount"
                  nameKey="cat"
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={98}
                  paddingAngle={2}
                >
                  {byCategory.map(({ cat }, i) => (
                    <Cell key={cat} fill={COLOURS[i % COLOURS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" fontSize={11} fill="#71717a">
                  Total
                </text>
                <text x="50%" y="57%" textAnchor="middle" dominantBaseline="middle" fontSize={14} fontWeight={700} fill="#18181b">
                  {fmt(totalSpent)}
                </text>
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
              {byCategory.map(({ cat, amount }, i) => (
                <div key={cat} className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLOURS[i % COLOURS.length] }} />
                  <span className="text-xs text-zinc-600 truncate">{cat}</span>
                  <span className="text-xs text-zinc-400 ml-auto shrink-0">{fmt(amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-[#399605]/10 border border-[#399605]/20 rounded-xl p-6 text-center">
          <p className="font-semibold text-zinc-900 mb-1">Ready to see your own numbers?</p>
          <p className="text-sm text-zinc-500 mb-4">
            Upload your bank CSV and Brian does the rest — no bank login, no scraping.
          </p>
          <Link
            href="/signup"
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white inline-block transition-opacity hover:opacity-90"
            style={{ background: '#399605' }}
          >
            Get started free — it&apos;s free
          </Link>
        </div>

      </div>
    </main>
  )
}
