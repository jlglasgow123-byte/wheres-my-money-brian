'use client'

import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

const DEMO_KEY = 'brian:demo'

interface AuthStore {
  user: User | null
  loading: boolean
  isDemoMode: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  enterDemoMode: () => void
  exitDemoMode: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  isDemoMode: false,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  enterDemoMode: () => {
    sessionStorage.setItem(DEMO_KEY, '1')
    set({ isDemoMode: true, loading: false })
  },
  exitDemoMode: () => {
    sessionStorage.removeItem(DEMO_KEY)
    set({ isDemoMode: false })
  },
}))

export function initAuth() {
  if (typeof window !== 'undefined' && sessionStorage.getItem(DEMO_KEY) === '1') {
    useAuthStore.setState({ isDemoMode: true, loading: false })
    return
  }

  supabase.auth.getUser().then(({ data: { user } }) => {
    useAuthStore.getState().setUser(user)
    useAuthStore.getState().setLoading(false)
  })

  supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.getState().setUser(session?.user ?? null)
    useAuthStore.getState().setLoading(false)
  })
}
