'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth'

export default function DemoButton() {
  const router = useRouter()
  const { enterDemoMode } = useAuthStore()

  function handleDemo() {
    enterDemoMode()
    router.push('/home')
  }

  return (
    <button
      onClick={handleDemo}
      className="px-8 py-3 rounded-xl font-semibold text-base text-zinc-600 border border-zinc-200 hover:border-zinc-300 hover:text-zinc-900 transition-colors"
    >
      Try demo
    </button>
  )
}
