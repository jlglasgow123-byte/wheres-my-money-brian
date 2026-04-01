import { create } from 'zustand'
import type { MalformedRow, Transaction } from '@/lib/normaliser/types'

export interface ReviewItem {
  original: Transaction
  category: string
  subcategory: string | null
  accepted: boolean
}

interface ReviewStore {
  items: ReviewItem[]
  fileName: string
  malformed: MalformedRow[]
  skippedCount: number
  setBatch: (transactions: Transaction[], fileName: string, malformed: MalformedRow[], skippedCount: number) => void
  updateItem: (index: number, category: string, subcategory: string | null) => void
  bulkUpdateItems: (indices: number[], category: string, subcategory: string | null) => void
  acceptByConfidence: (confidence: 'High' | 'Medium' | 'Low') => void
  clearBatch: () => void
}

export const useReviewStore = create<ReviewStore>((set) => ({
  items: [],
  fileName: '',
  malformed: [],
  skippedCount: 0,
  setBatch: (transactions, fileName, malformed, skippedCount) =>
    set({
      fileName,
      malformed,
      skippedCount,
      items: transactions.map(tx => ({
        original: tx,
        category: tx.category,
        subcategory: tx.subcategory,
        accepted: false,
      })),
    }),
  updateItem: (index, category, subcategory) =>
    set(state => ({
      items: state.items.map((item, i) =>
        i === index
          ? { ...item, category, subcategory, accepted: category !== 'Uncategorised' }
          : item
      ),
    })),
  bulkUpdateItems: (indices, category, subcategory) =>
    set(state => {
      const indexSet = new Set(indices)
      return {
        items: state.items.map((item, i) =>
          indexSet.has(i)
            ? { ...item, category, subcategory, accepted: category !== 'Uncategorised' }
            : item
        ),
      }
    }),
  acceptByConfidence: (confidence) =>
    set(state => ({
      items: state.items.map(item =>
        item.original.confidence === confidence && !item.original.conflict
          ? { ...item, accepted: true }
          : item
      ),
    })),
  clearBatch: () => set({ items: [], fileName: '', malformed: [], skippedCount: 0 }),
}))
