import Image from 'next/image'
import Link from 'next/link'

export default function HomeTestPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="px-8 py-5 flex items-center justify-between border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <Image src="/brian_logo.png" alt="Brian" width={36} height={36} priority />
          <span className="text-lg font-bold text-zinc-900">Brian</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/help"
            className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            FAQ
          </Link>
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
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <Image src="/Fav2BRIAN.png" alt="Brian" width={120} height={120} priority className="mb-8" />
        <p className="text-sm text-zinc-400 mb-3 tracking-wide">Brian doesn&rsquo;t judge. He just shows you the truth.</p>
        <h1 className="text-5xl font-bold text-zinc-900 mb-4 tracking-tight">
          Where the hell did your money go?
        </h1>
        <p className="text-lg text-zinc-500 max-w-md mb-10">
          Upload your bank CSV. See exactly what you&rsquo;re actually spending — no bank login, no risk.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <Link
            href="/signup"
            className="px-8 py-3 rounded-xl font-semibold text-base text-white transition-opacity hover:opacity-90"
            style={{ background: '#399605' }}
          >
            Upload CSV
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            Sign in
          </Link>
        </div>

        {/* Dashboard preview placeholder */}
        <div className="mt-14 w-full max-w-3xl bg-zinc-100 rounded-2xl flex items-center justify-center h-64 border border-zinc-200">
          <p className="text-sm text-zinc-400">Dashboard preview coming soon</p>
        </div>
      </div>

      {/* Supported banks — moved under hero */}
      <div className="px-6 py-8 border-t border-zinc-100">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-4">Works with Australian banks</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm font-medium text-zinc-500">
            <span className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg">Bankwest</span>
            <span className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg">CommBank</span>
            <span className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg">ANZ</span>
            <span className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg">NAB</span>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="border-t border-zinc-100 px-6 py-16 bg-zinc-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-zinc-900 text-center mb-10">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base mb-4" style={{ background: '#399605' }}>1</div>
              <Image src="/Upload_transactions_icon.png" alt="" width={60} height={60} className="mb-4" />
              <h3 className="font-semibold text-zinc-900 mb-2">Upload your CSV</h3>
              <p className="text-sm text-zinc-500">
                Export a CSV from your bank and upload it.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base mb-4" style={{ background: '#399605' }}>2</div>
              <Image src="/categorise_icon.png" alt="" width={60} height={60} className="mb-4" />
              <h3 className="font-semibold text-zinc-900 mb-2">Brian sorts everything</h3>
              <p className="text-sm text-zinc-500">
                Transactions are automatically grouped and organised for you.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base mb-4" style={{ background: '#399605' }}>3</div>
              <Image src="/Understand_icon.png" alt="" width={60} height={60} className="mb-4" />
              <h3 className="font-semibold text-zinc-900 mb-2">See where your money actually goes</h3>
              <p className="text-sm text-zinc-500">
                Clear breakdowns show your real spending patterns instantly.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Trust strip */}
      <div className="px-6 py-16 border-t border-zinc-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl font-bold text-zinc-900 mb-6">
            Your bank doesn&rsquo;t need to be involved
          </h2>
          <p className="text-zinc-500 mb-10 max-w-xl mx-auto">
            No logins. No account connections. Just your data, uploaded manually — exactly how it should be.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4 text-sm text-zinc-600">
            <div className="flex items-center gap-2">
              <span>🔒</span>
              <span>No bank login</span>
            </div>
            <div className="hidden sm:block text-zinc-300">•</div>
            <div className="flex items-center gap-2">
              <span>🇦🇺</span>
              <span>Works with Australian banks</span>
            </div>
            <div className="hidden sm:block text-zinc-300">•</div>
            <div className="flex items-center gap-2">
              <span>🚫</span>
              <span>No data selling</span>
            </div>
          </div>
          <p className="text-xs text-zinc-400 mt-6">
            Built for CommBank, ANZ, NAB, and Bankwest CSV formats
          </p>
        </div>
      </div>

      {/* Footer */}
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
