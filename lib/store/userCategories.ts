import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import { getUser } from '@/lib/supabase/auth'
import type { CategoryDef } from '@/lib/categories/defaults'

interface UserCategoryStore {
  userCategories: CategoryDef[]
  loaded: boolean
  loadUserCategories: () => Promise<void>
  addUserCategory: (name: string, subcategories: string[]) => Promise<void>
  deleteUserCategory: (name: string) => Promise<void>
}

export const useUserCategoryStore = create<UserCategoryStore>((set, get) => ({
  userCategories: [],
  loaded: false,

  loadUserCategories: async () => {
    const { data, error } = await supabase
      .from('user_categories')
      .select('name, subcategories')
      .order('created_at', { ascending: true })
    if (error) { console.error('Failed to load user categories:', error); return }
    set({
      userCategories: (data ?? []).map(r => ({
        name: r.name as string,
        subcategories: (r.subcategories as string[]) ?? [],
      })),
      loaded: true,
    })
  },

  addUserCategory: async (name, subcategories) => {
    const user = await getUser()
    if (!user) return
    const { error } = await supabase
      .from('user_categories')
      .insert({ user_id: user.id, name, subcategories })
    if (error) { console.error('Failed to add user category:', error.message); return }
    set(state => ({
      userCategories: [...state.userCategories, { name, subcategories }],
    }))
  },

  deleteUserCategory: async (name) => {
    const { error } = await supabase
      .from('user_categories')
      .delete()
      .eq('name', name)
    if (error) { console.error('Failed to delete user category:', error.message); return }
    set(state => ({
      userCategories: state.userCategories.filter(c => c.name !== name),
    }))
  },
}))
