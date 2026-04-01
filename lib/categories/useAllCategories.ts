import { useMemo } from 'react'
import { DEFAULT_CATEGORIES, type CategoryDef } from '@/lib/categories/defaults'
import { useUserCategoryStore } from '@/lib/store/userCategories'

export function useAllCategories(): CategoryDef[] {
  const { userCategories } = useUserCategoryStore()
  return useMemo(() => [...DEFAULT_CATEGORIES, ...userCategories], [userCategories])
}

export function useGetSubcategories() {
  const allCategories = useAllCategories()
  return (category: string): string[] =>
    allCategories.find(c => c.name === category)?.subcategories ?? []
}
