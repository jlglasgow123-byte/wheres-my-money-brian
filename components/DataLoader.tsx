'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useHistoryStore } from '@/lib/store/history'
import { useRulesStore } from '@/lib/store/rules'
import { useUserCategoryStore } from '@/lib/store/userCategories'
import { useAuthStore, initAuth } from '@/lib/store/auth'

const AUTH_PATHS = ['/landing', '/login', '/signup', '/auth/callback', '/forgot-password', '/auth/update-password', '/help', '/privacy', '/home-test']

export default function DataLoader() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading: authLoading } = useAuthStore()
  const { loadTransactions, loaded: historyLoaded } = useHistoryStore()
  const { loadRules, loaded: rulesLoaded } = useRulesStore()
  const { loadUserCategories, loadUserSubcategories, loaded: categoriesLoaded } = useUserCategoryStore()

  useEffect(() => {
    initAuth()
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      if (!AUTH_PATHS.some(p => pathname.startsWith(p))) {
        router.replace('/landing')
      }
      return
    }
    if (!historyLoaded) loadTransactions()
    if (!rulesLoaded) loadRules()
    if (!categoriesLoaded) loadUserCategories()
    loadUserSubcategories()
  }, [user, authLoading, pathname])

  return null
}
