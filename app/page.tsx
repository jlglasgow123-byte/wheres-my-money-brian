'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAvailableBanks, getParser } from '@/lib/parsers/registry'
import { normalise } from '@/lib/normaliser/normalise'
import { detectDuplicates } from '@/lib/duplicate/detect'
import { categorise } from '@/lib/categoriser/categorise'
import { useHistoryStore } from '@/lib/store/history'
import { useRulesStore } from '@/lib/store/rules'
import { useReviewStore } from '@/lib/store/review'
import DuplicateSummary from '@/components/upload/DuplicateSummary'
import DuplicateModal from '@/components/upload/DuplicateModal'
import type { MalformedRow, Transaction } from '@/lib/normaliser/types'

type UploadState =
  | { status: 'idle' }
  | { status: 'ready'; file: File }
  | {
      status: 'duplicates-pending'
      clean: Transaction[]
      duplicates: Transaction[]
      malformed: MalformedRow[]
      fileName: string
    }
  | {
      status: 'one-by-one'
      clean: Transaction[]
      duplicates: Transaction[]
      currentIndex: number
      decisions: Array<'import' | 'skip'>
      malformed: MalformedRow[]
      fileName: string
    }
  | { status: 'error'; message: string; detail?: string; fileName?: string }

export default function UploadPage() {
  const router = useRouter()
  const [selectedBank, setSelectedBank] = useState('')
  const [defaultBank, setDefaultBankState] = useState('')
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle' })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const banks = getAvailableBanks()
  const { transactions: history } = useHistoryStore()
  const { rules } = useRulesStore()
  const { setBatch } = useReviewStore()

  function resolveState(
    toImport: Transaction[],
    skippedCount: number,
    malformed: MalformedRow[],
    fileName: string
  ) {
    const categorised = categorise(toImport, rules)
    setBatch(categorised, fileName, malformed, skippedCount)
    router.push('/review')
  }

  useEffect(() => {
    const saved = localStorage.getItem('brian:defaultBank') ?? ''
    if (saved) {
      setDefaultBankState(saved)
      setSelectedBank(saved)
    }
  }, [])


  function handleSetDefault() {
    localStorage.setItem('brian:defaultBank', selectedBank)
    setDefaultBankState(selectedBank)
  }

  function handleRemoveDefault() {
    localStorage.removeItem('brian:defaultBank')
    setDefaultBankState('')
  }

  const hasStarted =
    selectedBank !== '' &&
    uploadState.status !== 'idle'

  function handleBankChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedBank(e.target.value)
    setUploadState({ status: 'idle' })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadState({ status: 'ready', file })
  }

  async function handleParse() {
    if (uploadState.status !== 'ready') return
    const parser = getParser(selectedBank)
    if (!parser) return

    const fileName = uploadState.file.name
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (ext !== 'csv') {
      setUploadState({ status: 'error', message: 'Please upload a CSV file.', fileName })
      return
    }

    const content = await uploadState.file.text()
    const result = parser.parse(content)

    if (!result.ok) {
      const messages: Record<typeof result.error, string> = {
        empty: 'This file is empty.',
        'no-rows': 'No transactions found in this file.',
        'invalid-headers': `This file does not match the ${parser.displayName} format.`,
      }
      setUploadState({
        status: 'error',
        message: messages[result.error],
        detail:
          result.error === 'invalid-headers' && result.missing?.length
            ? `Missing columns: ${result.missing.join(', ')}`
            : undefined,
        fileName,
      })
      return
    }

    const { transactions, malformed } = normalise(result.rows)
    const { clean, duplicates } = detectDuplicates(transactions, history)

    if (duplicates.length > 0) {
      setUploadState({ status: 'duplicates-pending', clean, duplicates, malformed, fileName })
    } else {
      resolveState(transactions, 0, malformed, fileName)
    }
  }

  function handleImportAll() {
    if (uploadState.status !== 'duplicates-pending') return
    resolveState([...uploadState.clean, ...uploadState.duplicates], 0, uploadState.malformed, uploadState.fileName)
  }

  function handleSkipAll() {
    if (uploadState.status !== 'duplicates-pending') return
    resolveState(uploadState.clean, uploadState.duplicates.length, uploadState.malformed, uploadState.fileName)
  }

  function handleStartOneByOne() {
    if (uploadState.status !== 'duplicates-pending') return
    setUploadState({
      status: 'one-by-one',
      clean: uploadState.clean,
      duplicates: uploadState.duplicates,
      currentIndex: 0,
      decisions: [],
      malformed: uploadState.malformed,
      fileName: uploadState.fileName,
    })
  }

  function handleOneByOneDecision(decision: 'import' | 'skip') {
    if (uploadState.status !== 'one-by-one') return

    const newDecisions = [...uploadState.decisions, decision]
    const nextIndex = uploadState.currentIndex + 1

    if (nextIndex >= uploadState.duplicates.length) {
      const importedDuplicates = uploadState.duplicates.filter((_, i) => newDecisions[i] === 'import')
      resolveState(
        [...uploadState.clean, ...importedDuplicates],
        newDecisions.filter(d => d === 'skip').length,
        uploadState.malformed,
        uploadState.fileName,
      )
    } else {
      setUploadState({ ...uploadState, currentIndex: nextIndex, decisions: newDecisions })
    }
  }

  function handleCancel() {
    setUploadState({ status: 'idle' })
    setSelectedBank('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <main className="min-h-screen bg-zinc-50 flex flex-col items-center pt-24 px-6">
      <div className="w-full max-w-md">
        <h1 className="text-xl font-semibold text-zinc-900 mb-6">Upload transactions</h1>

        <div className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100">
          {/* Bank selector */}
          <div className="p-5">
            <label htmlFor="bank-select" className="block text-sm font-medium text-zinc-700 mb-2">
              Your bank
            </label>
            <select
              id="bank-select"
              value={selectedBank}
              onChange={handleBankChange}
              autoComplete="off"
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 bg-white font-sans focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a bank</option>
              {banks.map(b => (
                <option key={b.bankId} value={b.bankId}>{b.displayName}</option>
              ))}
            </select>
            {selectedBank && selectedBank === defaultBank && (
              <p className="mt-2 text-xs text-zinc-400">
                ✓ Default bank ·{' '}
                <button onClick={handleRemoveDefault} className="underline underline-offset-2 hover:text-zinc-600">
                  Remove
                </button>
              </p>
            )}
            {selectedBank && selectedBank !== defaultBank && (
              <p className="mt-2 text-xs text-zinc-400">
                <button onClick={handleSetDefault} className="underline underline-offset-2 hover:text-zinc-600">
                  Set as default
                </button>
              </p>
            )}
          </div>

          {/* File upload */}
          <div className="p-5">
            <label htmlFor="csv-upload" className="block text-sm font-medium text-zinc-700 mb-2">
              Transaction file (CSV)
            </label>
            <input
              id="csv-upload"
              ref={fileInputRef}
              type="file"
              accept=".csv"
              disabled={!selectedBank}
              onChange={handleFileChange}
              className="w-full text-sm text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            />
            {!selectedBank && (
              <p className="mt-1.5 text-xs text-zinc-400">Select a bank first.</p>
            )}
          </div>

          {/* Upload + Cancel buttons */}
          {(uploadState.status === 'ready' || hasStarted) && (
            <div className="p-5 flex gap-3">
              {uploadState.status === 'ready' && (
                <button
                  onClick={handleParse}
                  className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Upload My Transactions
                </button>
              )}
              {hasStarted && (
                <button
                  onClick={handleCancel}
                  className="flex-1 border border-zinc-300 text-zinc-600 text-sm font-medium py-2 px-4 rounded-lg hover:bg-zinc-50 transition-colors"
                >
                  Cancel upload
                </button>
              )}
            </div>
          )}

          {/* Error */}
          {uploadState.status === 'error' && (
            <div className="p-5">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                {uploadState.fileName && (
                  <p className="text-xs font-mono text-red-500 mb-1">{uploadState.fileName}</p>
                )}
                <p className="text-sm font-medium text-red-800">{uploadState.message}</p>
                {uploadState.detail && (
                  <p className="text-sm text-red-700 mt-1">{uploadState.detail}</p>
                )}
                <p className="text-sm text-red-700 mt-3">
                  Hmmm... now what? Visit our{' '}
                  <a href="/help" className="underline underline-offset-2 font-medium">
                    help centre
                  </a>{' '}
                  for guidance on how to resolve common issues.
                </p>
              </div>
            </div>
          )}

          {/* Duplicate resolution */}
          {uploadState.status === 'duplicates-pending' && (
            <div className="p-5">
              <DuplicateSummary
                duplicates={uploadState.duplicates}
                onImportAll={handleImportAll}
                onSkipAll={handleSkipAll}
                onOneByOne={handleStartOneByOne}
              />
            </div>
          )}

        </div>
      </div>

      {/* One-by-one modal */}
      {uploadState.status === 'one-by-one' && (
        <DuplicateModal
          transaction={uploadState.duplicates[uploadState.currentIndex]}
          current={uploadState.currentIndex + 1}
          total={uploadState.duplicates.length}
          onImport={() => handleOneByOneDecision('import')}
          onSkip={() => handleOneByOneDecision('skip')}
        />
      )}
    </main>
  )
}
