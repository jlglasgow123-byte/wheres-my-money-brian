import Image from 'next/image'
import Link from 'next/link'
import DemoButton from '@/components/DemoButton'

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="px-8 py-5 flex items-center justify-between border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <Image src="/brian_logo.png" alt="Brian" width={36} height={36} priority />
          <span className="text-lg font-bold text-zinc-900">Brian</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/help" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
            Help
          </Link>
          <Link href="/login" className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: '#399605' }}
          >
            Get started
          </Link>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <Image src="/Fav2BRIAN.png" alt="Brian" width={88} height={88} priority className="mb-8" />
        <h1 className="text-5xl font-bold text-zinc-900 mb-5 tracking-tight max-w-xl leading-tight">
          You&apos;re leaking money.<br />Brian shows you where.
        </h1>
        <p className="text-lg text-zinc-500 max-w-lg mb-8 leading-relaxed">
          Upload your bank CSV and Brian turns your transactions into plain-English spending insights — leaks, subscriptions, categories, and monthly totals.
        </p>

        {/* Bullet points */}
        <ul className="flex flex-col gap-2 mb-10 text-sm text-zinc-600 text-left">
          <li className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs shrink-0" style={{ background: '#399605' }}>✓</span>
            See your total monthly spend in seconds
          </li>
          <li className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs shrink-0" style={{ background: '#399605' }}>✓</span>
            Find your biggest spending leaks
          </li>
          <li className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs shrink-0" style={{ background: '#399605' }}>✓</span>
            Spot subscriptions and repeat charges fast
          </li>
        </ul>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 items-center mb-4">
          <DemoButton label="Try demo — no upload" variant="primary" />
          <Link
            href="/signup"
            className="px-8 py-3 rounded-xl font-semibold text-base text-zinc-600 border border-zinc-200 hover:border-zinc-300 hover:text-zinc-900 transition-colors"
          >
            Upload my CSV
          </Link>
        </div>
        <p className="text-xs text-zinc-400">
          No budgeting guilt. No spreadsheets. Just the uncomfortable truth.
        </p>
      </div>

      {/* ── Demo Snapshot ──────────────────────────────────────────── */}
      <div className="border-t border-zinc-100 px-6 py-16 bg-zinc-50">
        <div className="max-w-lg mx-auto">
          <p className="text-center text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">
            Demo insight
          </p>
          <h2 className="text-2xl font-bold text-zinc-900 text-center mb-3">
            This is what Brian shows you in seconds
          </h2>
          <p className="text-center text-sm text-zinc-500 mb-8">
            Most people think they know where their money goes. Brian makes it painfully obvious.
          </p>

          {/* Demo card */}
          <div className="relative">
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">

              {/* Top stat bar */}
              <div className="border-b border-zinc-100 px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-400 mb-0.5">March 2026</p>
                  <p className="text-2xl font-bold text-zinc-900">
                    $3,142 <span className="text-sm font-normal text-zinc-400">spent</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-400 mb-0.5">vs last month</p>
                  <p className="text-sm font-semibold text-red-500">+$284 ↑</p>
                </div>
              </div>

              {/* Insight cards */}
              <div className="p-5 flex flex-col gap-3">

                {/* Money leak */}
                <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-amber-900">Top leak: Uber</p>
                    <p className="text-xs text-amber-700 mt-0.5">Rides + food delivery · 14 trips</p>
                  </div>
                  <p className="text-xl font-bold text-amber-900">$412</p>
                </div>

                {/* Subscriptions */}
                <div className="flex items-center justify-between bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-zinc-800">Subscriptions</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Netflix · Spotify · Disney+ · Optus</p>
                  </div>
                  <p className="text-xl font-bold text-zinc-900">$96<span className="text-sm font-medium text-zinc-500">/mo</span></p>
                </div>

                {/* Category mini grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-zinc-400 mb-1">Groceries</p>
                    <p className="text-sm font-bold text-zinc-900">$654</p>
                  </div>
                  <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-zinc-400 mb-1">Dining</p>
                    <p className="text-sm font-bold text-zinc-900">$389</p>
                  </div>
                  <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-zinc-400 mb-1">Fuel</p>
                    <p className="text-sm font-bold text-zinc-900">$90</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Fade overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-zinc-50 to-transparent rounded-b-2xl pointer-events-none" />
          </div>

          <p className="text-center text-xs text-zinc-400 mt-5 mb-8">
            This is demo data. Yours might be more interesting. Or worse.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <DemoButton label="Try demo — no upload" variant="primary" />
            <Link
              href="/signup"
              className="px-8 py-3 rounded-xl font-semibold text-base text-zinc-600 border border-zinc-200 hover:border-zinc-300 hover:text-zinc-900 transition-colors text-center"
            >
              Upload my CSV
            </Link>
          </div>
        </div>
      </div>

      {/* ── How it works ───────────────────────────────────────────── */}
      <div className="border-t border-zinc-100 px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">
            How it works
          </p>
          <h2 className="text-2xl font-bold text-zinc-900 text-center mb-12">
            Three steps. Zero financial wizardry.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base mb-4" style={{ background: '#399605' }}>1</div>
              <Image src="/Upload_transactions_icon.png" alt="" width={60} height={60} className="mb-4" />
              <h3 className="font-semibold text-zinc-900 mb-2">Try the demo first</h3>
              <p className="text-sm text-zinc-500">
                See example insights instantly without uploading anything.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base mb-4" style={{ background: '#399605' }}>2</div>
              <Image src="/categorise_icon.png" alt="" width={60} height={60} className="mb-4" />
              <h3 className="font-semibold text-zinc-900 mb-2">Upload your CSV</h3>
              <p className="text-sm text-zinc-500">
                Use an exported bank transaction file when you&apos;re ready to see your own numbers.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base mb-4" style={{ background: '#399605' }}>3</div>
              <Image src="/Understand_icon.png" alt="" width={60} height={60} className="mb-4" />
              <h3 className="font-semibold text-zinc-900 mb-2">Brian finds the patterns</h3>
              <p className="text-sm text-zinc-500">
                Get totals, categories, repeat charges, subscriptions, and your biggest leaks.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── What Brian finds ───────────────────────────────────────── */}
      <div className="border-t border-zinc-100 px-6 py-16 bg-zinc-50">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">
            What you get
          </p>
          <h2 className="text-2xl font-bold text-zinc-900 text-center mb-10">
            Brian turns transaction chaos into<br />&ldquo;ohhh, that&apos;s where it went.&rdquo;
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-zinc-200 rounded-xl p-6">
              <p className="text-base font-semibold text-zinc-900 mb-1">Spending leaks</p>
              <p className="text-sm text-zinc-500">Find the places quietly draining your money.</p>
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl p-6">
              <p className="text-base font-semibold text-zinc-900 mb-1">Subscriptions</p>
              <p className="text-sm text-zinc-500">See repeat charges and monthly subscription totals.</p>
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl p-6">
              <p className="text-base font-semibold text-zinc-900 mb-1">Category breakdowns</p>
              <p className="text-sm text-zinc-500">Understand where your money actually goes each month.</p>
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl p-6">
              <p className="text-base font-semibold text-zinc-900 mb-1">Month-to-month changes</p>
              <p className="text-sm text-zinc-500">See what went up, what changed, and what needs attention.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Trust / Privacy ────────────────────────────────────────── */}
      <div className="border-t border-zinc-100 px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">
            Privacy
          </p>
          <h2 className="text-2xl font-bold text-zinc-900 text-center mb-4">
            Your money data should not feel like a trap.
          </h2>
          <p className="text-center text-sm text-zinc-500 mb-10 max-w-xl mx-auto">
            Brian is designed to show insights from your transaction data without making you hand over more than necessary.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="flex items-start gap-3 bg-zinc-50 border border-zinc-100 rounded-xl px-5 py-4">
              <span className="text-lg mt-0.5">🕹️</span>
              <div>
                <p className="text-sm font-semibold text-zinc-900">Demo works without uploading</p>
                <p className="text-xs text-zinc-500 mt-0.5">See how Brian works before sharing any data at all.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-zinc-50 border border-zinc-100 rounded-xl px-5 py-4">
              <span className="text-lg mt-0.5">📄</span>
              <div>
                <p className="text-sm font-semibold text-zinc-900">You control what you upload</p>
                <p className="text-xs text-zinc-500 mt-0.5">CSV upload means you choose what to provide — no bank login, no scraping.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-zinc-50 border border-zinc-100 rounded-xl px-5 py-4">
              <span className="text-lg mt-0.5">🔒</span>
              <div>
                <p className="text-sm font-semibold text-zinc-900">No bank login ever</p>
                <p className="text-xs text-zinc-500 mt-0.5">Brian never asks for bank credentials, account access, or third-party integrations.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-zinc-50 border border-zinc-100 rounded-xl px-5 py-4">
              <span className="text-lg mt-0.5">🚫</span>
              <div>
                <p className="text-sm font-semibold text-zinc-900">No data selling. Ever.</p>
                <p className="text-xs text-zinc-500 mt-0.5">Your transaction data is never sold, shared, or used for advertising.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Supported banks ────────────────────────────────────────── */}
      <div className="border-t border-zinc-100 px-6 py-12 bg-zinc-50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">Supported banks</p>
          <div className="flex flex-wrap justify-center gap-3 text-sm font-medium text-zinc-600">
            <span className="px-4 py-2 bg-white border border-zinc-200 rounded-lg">Bankwest</span>
            <span className="px-4 py-2 bg-white border border-zinc-200 rounded-lg">CommBank</span>
            <span className="px-4 py-2 bg-white border border-zinc-200 rounded-lg">ANZ</span>
            <span className="px-4 py-2 bg-white border border-zinc-200 rounded-lg">NAB</span>
            <span className="px-4 py-2 bg-white border border-zinc-200 rounded-lg">Macquarie</span>
          </div>
        </div>
      </div>

      {/* ── Final CTA ──────────────────────────────────────────────── */}
      <div className="border-t border-zinc-100 px-6 py-20">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4 tracking-tight">
            Ready to find out where it went?
          </h2>
          <p className="text-base text-zinc-500 mb-8">
            Start with demo mode. No upload. No commitment. Just see what Brian can show you.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <DemoButton label="Try demo — no upload" variant="primary" />
            <Link
              href="/signup"
              className="px-8 py-3 rounded-xl font-semibold text-base text-zinc-600 border border-zinc-200 hover:border-zinc-300 hover:text-zinc-900 transition-colors text-center"
            >
              Upload my CSV
            </Link>
          </div>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <div className="px-6 py-8 border-t border-zinc-100">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <span>Brian — personal finance, done properly.</span>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-zinc-700 transition-colors">Privacy Policy</Link>
            <Link href="/help" className="hover:text-zinc-700 transition-colors">FAQ</Link>
            <Link href="/login" className="hover:text-zinc-700 transition-colors">Sign in</Link>
          </div>
        </div>
      </div>

    </main>
  )
}
