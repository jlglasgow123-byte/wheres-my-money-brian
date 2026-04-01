import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import { getUser } from '@/lib/supabase/auth'
import type { CategoryDef } from '@/lib/categories/defaults'

interface UserCategoryStore {
  userCategories: CategoryDef[]
  // category_name → user-added subcategory names
  userSubcategories: Record<string, string[]>
  loaded: boolean
  loadUserCategories: () => Promise<void>
  loadUserSubcategories: () => Promise<void>
  addUserCategory: (name: string, subcategories: string[]) => Promise<void>
  deleteUserCategory: (name: string) => Promise<void>
  addUserSubcategory: (categoryName: string, subcategoryName: string) => Promise<void>
}

export const useUserCategoryStore = create<UserCategoryStore>((set) => ({
  userCategories: [],
  userSubcategories: {},
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

  loadUserSubcategories: async () => {
    const { data, error } = await supabase
      .from('user_subcategories')
      .select('category_name, subcategory_name')
      .order('created_at', { ascending: true })
    if (error) { console.error('Failed to load user subcategories:', error); return }
    const map: Record<string, string[]> = {}
    for (const row of data ?? []) {
      const cat = row.category_name as string
      const sub = row.subcategory_name as string
      if (!map[cat]) map[cat] = []
      map[cat].push(sub)
    }
    set({ userSubcategories: map })
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

  addUserSubcategory: async (categoryName, subcategoryName) => {
    const user = await getUser()
    if (!user) return
    const { error } = await supabase
      .from('user_subcategories')
      .insert({ user_id: user.id, category_name: categoryName, subcategory_name: subcategoryName })
    if (error) { console.error('Failed to add user subcategory:', error.message); return }
    set(state => {
      const existing = state.userSubcategories[categoryName] ?? []
      if (existing.includes(subcategoryName)) return state
      return {
        userSubcategories: {
          ...state.userSubcategories,
          [categoryName]: [...existing, subcategoryName],
        },
      }
    })
  },
}))
