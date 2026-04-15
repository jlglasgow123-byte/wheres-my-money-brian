'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth'

interface DemoButtonProps {
  label?: string
  variant?: 'primary' | 'secondary'
}

export default function DemoButton({ label = 'Try demo', variant = 'secondary' }: DemoButtonProps) {
  const router = useRouter()
  const { enterDemoMode } = useAuthStore()

  function handleDemo() {
    enterDemoMode()
    router.push('/demo')
  }

  if (variant === 'primary') {
    return (
      <button
        onClick={handleDemo}
        className="px-8 py-3 rounded-xl font-semibold text-base text-white transition-opacity hover:opacity-90"
        style={{ background: '#399605' }}
      >
        {label}
      </button>
    )
  }

  return (
    <button
      onClick={handleDemo}
      className="px-8 py-3 rounded-xl font-semibold text-base text-zinc-600 border border-zinc-200 hover:border-zinc-300 hover:text-zinc-900 transition-colors"
    >
      {label}
    </button>
  )
}
