'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { sendPasswordReset } from '@/lib/supabase/auth'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await sendPasswordReset(email)
    setLoading(false)
    if (error) { setError(error.message); return }
    setSent(true)
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-white">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Image src="/brian_logo.png" alt="Brian" width={64} height={64} priority className="mb-4" />
          <h1 className="text-2xl font-bold text-zinc-900">Reset your password</h1>
          <p className="text-sm text-zinc-500 mt-1">We&apos;ll send you a link to set a new one.</p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8">
          {sent ? (
            <div className="text-center space-y-3">
              <p className="text-sm text-zinc-700 font-medium">Check your email</p>
              <p className="text-sm text-zinc-500">
                A password reset link has been sent to <span className="font-medium">{email}</span>.
              </p>
              <Link
                href="/login"
                className="block mt-4 text-sm font-medium underline underline-offset-2"
                style={{ color: '#399605' }}
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full border border-zinc-300 rounded-xl px-3 py-2.5 text-sm font-sans text-zinc-900 focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: '#399605' }}
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
              <p className="text-center text-xs text-zinc-500">
                <Link href="/login" className="font-medium underline underline-offset-2" style={{ color: '#399605' }}>
                  Back to sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
