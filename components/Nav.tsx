'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth'
import { signOut } from '@/lib/supabase/auth'

function DemoBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-6 py-2">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <span className="text-sm text-amber-800">
          Demo mode — changes are lost on refresh.
        </span>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => window.location.reload()}
            className="text-xs font-medium text-amber-700 hover:text-amber-900 underline underline-offset-2 transition-colors"
          >
            Reset demo
          </button>
          <Link
            href="/signup"
            className="px-3 py-1 rounded-md text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: '#399605' }}
          >
            Sign up free
          </Link>
        </div>
      </div>
    </div>
  )
}

const links = [
  { href: '/', label: 'Upload' },
  { href: '/history', label: 'Transactions' },
  { href: '/insights', label: 'Insights' },
  { href: '/rules', label: 'Rules' },
  { href: '/help', label: 'Help' },
]

const HIDDEN_PATHS = ['/landing', '/login', '/signup', '/auth/callback', '/privacy', '/home-test']

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isDemoMode } = useAuthStore()

  if (HIDDEN_PATHS.some(p => pathname.startsWith(p))) return null

  async function handleSignOut() {
    await signOut()
    router.replace('/landing')
  }

  return (
    <>
    {isDemoMode && <DemoBanner />}
    <nav className="bg-white border-b border-zinc-200 px-6 py-3">
      <div className="max-w-6xl mx-auto flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image src="/brian_logo.png" alt="Brian" width={28} height={28} />
          <span className="text-sm font-semibold text-zinc-900">Brian</span>
        </Link>
        <div className="flex items-center gap-1 flex-1">
          {isDemoMode && (
            <Link
              href="/demo"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname.startsWith('/demo')
                  ? 'bg-[#399605]/10 text-[#399605] font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              Demo
            </Link>
          )}
          {links.map(link => {
            const isActive = link.href === '/'
              ? pathname === '/'
              : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#399605]/10 text-[#399605] font-semibold'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
        {user && (
          <div className="flex items-center gap-4 shrink-0">
            <span className="text-xs text-zinc-400 truncate max-w-48">{user.email}</span>
            <button
              onClick={handleSignOut}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
    </>
  )
}
