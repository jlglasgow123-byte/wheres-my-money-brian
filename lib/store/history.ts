import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import { getUser } from '@/lib/supabase/auth'
import type { Transaction } from '@/lib/normaliser/types'

interface HistoryStore {
  transactions: Transaction[]
  loaded: boolean
  loadTransactions: () => Promise<void>
  addTransactions: (txs: Transaction[]) => Promise<void>
  updateTransaction: (id: string, category: string, subcategory: string | null) => Promise<void>
  bulkUpdateCategory: (ids: string[], category: string, subcategory: string | null) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  clear: () => void
}

function toRow(tx: Transaction) {
  return {
    date: tx.date,
    narration: tx.narration,
    debit: tx.debit,
    credit: tx.credit,
    balance: tx.balance,
    bsb: tx.bsb,
    account_number: tx.accountNumber,
    cheque: tx.cheque,
    transaction_type: tx.transactionType,
    category: tx.category,
    subcategory: tx.subcategory,
    confidence: tx.confidence,
    conflict: tx.conflict,
    upload_session_id: tx.uploadSessionId,
  }
}

function fromRow(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as string,
    date: row.date as string,
    narration: row.narration as string,
    debit: row.debit as number | null,
    credit: row.credit as number | null,
    balance: row.balance as number,
    bsb: row.bsb as string,
    accountNumber: row.account_number as string,
    cheque: row.cheque as string | null,
    transactionType: row.transaction_type as string,
    category: row.category as string,
    subcategory: row.subcategory as string | null,
    confidence: row.confidence as 'High' | 'Medium' | 'Low' | null,
    conflict: row.conflict as boolean,
    uploadSessionId: row.upload_session_id as string | null,
    importedAt: row.created_at
      ? new Date(row.created_at as string).toISOString().slice(0, 10)
      : undefined,
  }
}

export const useHistoryStore = create<HistoryStore>((set) => ({
  transactions: [],
  loaded: false,
  loadTransactions: async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
    if (error) { console.error('Failed to load transactions:', error); return }
    set({ transactions: (data ?? []).map(fromRow), loaded: true })
  },
  addTransactions: async (txs) => {
    const user = await getUser()
    if (!user) { console.error('Cannot save transactions: not authenticated'); return }
    const rows = txs.map(tx => ({ ...toRow(tx), user_id: user.id }))
    const { data, error } = await supabase.from('transactions').insert(rows).select()
    if (error) { console.error('Failed to save transactions:', error); return }
    const saved = (data ?? []).map(fromRow)
    set(state => ({ transactions: [...saved, ...state.transactions] }))
  },
  updateTransaction: async (id, category, subcategory) => {
    const { error } = await supabase
      .from('transactions')
      .update({ category, subcategory })
      .eq('id', id)
    if (error) { console.error('Failed to update transaction:', error); return }
    set(state => ({
      transactions: state.transactions.map(tx =>
        tx.id === id ? { ...tx, category, subcategory } : tx
      ),
    }))
  },
  bulkUpdateCategory: async (ids, category, subcategory) => {
    const { error } = await supabase
      .from('transactions')
      .update({ category, subcategory })
      .in('id', ids)
    if (error) { console.error('Failed to bulk update transactions:', error); return }
    set(state => ({
      transactions: state.transactions.map(tx =>
        ids.includes(tx.id ?? '') ? { ...tx, category, subcategory } : tx
      ),
    }))
  },
  deleteTransaction: async (id) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) { console.error('Failed to delete transaction:', error); return }
    set(state => ({ transactions: state.transactions.filter(tx => tx.id !== id) }))
  },
  clear: () => set({ transactions: [], loaded: false }),
}))
