import Image from 'next/image'
import Link from 'next/link'
import DemoButton from '@/components/DemoButton'

export default function LandingPage() {
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
        <h1 className="text-5xl font-bold text-zinc-900 mb-4 tracking-tight">
          Where&rsquo;s my money, Brian?
        </h1>
        <p className="text-lg text-zinc-500 max-w-md mb-10">
          Upload your bank CSV. Brian automatically categorises your transactions so you know exactly where your money went.
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
          <DemoButton />
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
                Export a CSV from your bank and upload it. Supports Bankwest, CommBank, ANZ, and NAB.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base mb-4" style={{ background: '#399605' }}>2</div>
              <Image src="/categorise_icon.png" alt="" width={60} height={60} className="mb-4" />
              <h3 className="font-semibold text-zinc-900 mb-2">Brian categorises</h3>
              <p className="text-sm text-zinc-500">
                Brian automatically categorises common merchants. Review, correct, and teach Brian your preferences.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base mb-4" style={{ background: '#399605' }}>3</div>
              <Image src="/Understand_icon.png" alt="" width={60} height={60} className="mb-4" />
              <h3 className="font-semibold text-zinc-900 mb-2">Understand your spending</h3>
              <p className="text-sm text-zinc-500">
                See exactly where your money goes with charts and breakdowns — based on your real transactions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Trust signals */}
      <div className="px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-zinc-900 text-center mb-10">Your data stays yours</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="font-semibold text-zinc-900 mb-2">No bank login required</h3>
              <p className="text-sm text-zinc-500">
                Brian never asks for your banking credentials. You upload a CSV export — nothing more.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-3xl mb-3">🇦🇺</div>
              <h3 className="font-semibold text-zinc-900 mb-2">Australian privacy compliant</h3>
              <p className="text-sm text-zinc-500">
                Built in compliance with the Privacy Act 1988 and Australian Privacy Principles.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-3xl mb-3">🚫</div>
              <h3 className="font-semibold text-zinc-900 mb-2">No data selling</h3>
              <p className="text-sm text-zinc-500">
                Your transaction data is never sold, shared, or used for advertising. Ever.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Supported banks */}
      <div className="border-t border-zinc-100 px-6 py-12 bg-zinc-50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">Supported banks</p>
          <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-zinc-600">
            <span className="px-4 py-2 bg-white border border-zinc-200 rounded-lg">Bankwest</span>
            <span className="px-4 py-2 bg-white border border-zinc-200 rounded-lg">CommBank</span>
            <span className="px-4 py-2 bg-white border border-zinc-200 rounded-lg">ANZ</span>
            <span className="px-4 py-2 bg-white border border-zinc-200 rounded-lg">NAB</span>
          </div>
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
