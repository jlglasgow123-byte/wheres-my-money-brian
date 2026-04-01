'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth'
import { signOut } from '@/lib/supabase/auth'

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/history', label: 'Transactions' },
  { href: '/', label: 'Upload' },
  { href: '/rules', label: 'Rules' },
  { href: '/help', label: 'Help' },
]

const HIDDEN_PATHS = ['/landing', '/login', '/signup', '/auth/callback']

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuthStore()

  if (HIDDEN_PATHS.some(p => pathname.startsWith(p))) return null

  async function handleSignOut() {
    await signOut()
    router.replace('/landing')
  }

  return (
    <nav className="bg-white border-b border-zinc-200 px-6 py-3">
      <div className="max-w-6xl mx-auto flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image src="/brian_logo.png" alt="Brian" width={28} height={28} />
          <span className="text-sm font-semibold text-zinc-900">Brian</span>
        </Link>
        <div className="flex items-center gap-1 flex-1">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'bg-zinc-100 text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              {link.label}
            </Link>
          ))}
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
  )
}
