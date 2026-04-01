import Image from 'next/image'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="px-8 py-5 flex items-center justify-between border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <Image src="/brian_logo.png" alt="Brian" width={36} height={36} priority />
          <span className="text-lg font-bold text-zinc-900">Brian</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
          >
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

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 text-center">
        <Image src="/brian_logo.png" alt="Brian" width={260} height={260} priority className="mb-8" />
        <h1 className="text-5xl font-bold text-zinc-900 mb-4 tracking-tight">
          Where&rsquo;s my money, Brian?
        </h1>
        <p className="text-lg text-zinc-500 max-w-md mb-10">
          Brian automatically categorises your transactions so you know exactly where your money went.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <Link
            href="/signup"
            className="px-8 py-3 rounded-xl font-semibold text-base text-white transition-opacity hover:opacity-90"
            style={{ background: '#399605' }}
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 rounded-xl font-semibold text-base text-zinc-600 border border-zinc-200 hover:border-zinc-300 hover:text-zinc-900 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="border-t border-zinc-100 px-6 py-16 bg-zinc-50">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">
          <div className="flex flex-col items-center">
            <Image src="/Upload_transactions_icon.png" alt="" width={72} height={72} className="mb-4" />
            <h3 className="font-semibold text-zinc-900 mb-2">Upload CSV</h3>
            <p className="text-sm text-zinc-500">
              Import your bank transactions directly from a CSV export. Bankwest supported out of the box.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <Image src="/categorise_icon.png" alt="" width={72} height={72} className="mb-4" />
            <h3 className="font-semibold text-zinc-900 mb-2">Categorise</h3>
            <p className="text-sm text-zinc-500">
              Brian auto-categorises common merchants. Review, correct, and teach Brian your preferences.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <Image src="/Understand_icon.png" alt="" width={72} height={72} className="mb-4" />
            <h3 className="font-semibold text-zinc-900 mb-2">Understand</h3>
            <p className="text-sm text-zinc-500">
              See exactly where your money goes with verified spending data — not estimates.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-6 text-center text-xs text-zinc-400 border-t border-zinc-100">
        Brian — personal finance, done properly.
      </div>
    </main>
  )
}
