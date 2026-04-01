import { useMemo } from 'react'
import { DEFAULT_CATEGORIES, type CategoryDef } from '@/lib/categories/defaults'
import { useUserCategoryStore } from '@/lib/store/userCategories'

export function useAllCategories(): CategoryDef[] {
  const { userCategories, userSubcategories } = useUserCategoryStore()
  return useMemo(() => {
    const base = [...DEFAULT_CATEGORIES, ...userCategories]
    return base.map(cat => {
      const extra = userSubcategories[cat.name] ?? []
      if (extra.length === 0) return cat
      const merged = [...new Set([...cat.subcategories, ...extra])]
      return { ...cat, subcategories: merged }
    })
  }, [userCategories, userSubcategories])
}

export function useGetSubcategories() {
  const allCategories = useAllCategories()
  return (category: string): string[] =>
    allCategories.find(c => c.name === category)?.subcategories ?? []
}
