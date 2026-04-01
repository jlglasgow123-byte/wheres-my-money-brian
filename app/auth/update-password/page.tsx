'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { updatePassword } from '@/lib/supabase/auth'

function validatePassword(pw: string): string {
  if (pw.length < 8) return 'Password must be at least 8 characters.'
  if (!/[a-z]/.test(pw)) return 'Password must include at least one lowercase letter.'
  if (!/[A-Z]/.test(pw)) return 'Password must include at least one uppercase letter.'
  if (!/[^a-zA-Z0-9]/.test(pw)) return 'Password must include at least one symbol.'
  return ''
}

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const validationError = validatePassword(password)
    if (validationError) { setError(validationError); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    const { error } = await updatePassword(password)
    setLoading(false)
    if (error) { setError(error.message); return }
    router.replace('/dashboard')
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-white">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Image src="/brian_logo.png" alt="Brian" width={64} height={64} priority className="mb-4" />
          <h1 className="text-2xl font-bold text-zinc-900">Set a new password</h1>
          <p className="text-sm text-zinc-500 mt-1">Choose a strong password for your account.</p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">New password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full border border-zinc-300 rounded-xl px-3 py-2.5 text-sm font-sans text-zinc-900 focus:outline-none focus:ring-2 focus:ring-green-600"
              />
              <p className="mt-1 text-xs text-zinc-400">
                At least 8 characters · uppercase · lowercase · symbol
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
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
              {loading ? 'Saving…' : 'Save new password'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
