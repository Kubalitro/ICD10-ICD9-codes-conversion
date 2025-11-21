'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '../context/LanguageContext'
import BatchUpload from '../components/BatchUpload'
import BatchHistoryList from '../components/BatchHistoryList'
import BatchResultsTable, { BatchResult } from '../components/BatchResultsTable'

export default function BatchPage() {
  const { t } = useLanguage()
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text')

  // Text Processing State
  const [input, setInput] = useState('')
  const [direction, setDirection] = useState<'icd10to9' | 'icd9to10'>('icd10to9')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<BatchResult[]>([])

  // File Processing State
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const handleProcessText = async () => {
    setLoading(true)
    setResults([])

    try {
      const codes = input
        .split(/[,\n]/)
        .map(c => c.trim())
        .filter(c => c.length > 0)

      const system = direction === 'icd10to9' ? 'icd10' : 'icd9'

      // Use bulk API endpoint
      const response = await fetch('/api/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes, system })
      })

      if (!response.ok) {
        throw new Error('Batch processing failed')
      }

      const data = await response.json()

      // Transform API response to BatchResult format
      const batchResults: BatchResult[] = data.conversions.map((conv: any) => ({
        code: conv.sourceCode,
        conversions: conv.targetCodes || [],
        error: conv.error,
        scores: conv.scores
      }))

      setResults(batchResults)
    } catch (error) {
      console.error('Batch processing error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportText = () => {
    const csv = ['Code,Conversions,Charlson Score,Charlson Condition,Elixhauser Categories,HCC Category,Status,Error\n']
    results.forEach(result => {
      const escapedCode = `"${result.code.replace(/"/g, '""')}"`
      const escapedConvs = `"${result.conversions.join(', ').replace(/"/g, '""')}"`

      // Add comorbidity scores
      const charlsonScore = result.scores?.charlson?.score || ''
      const charlsonCondition = result.scores?.charlson?.condition ? `"${result.scores.charlson.condition.replace(/"/g, '""')}"` : ''
      const elixhauserCats = result.scores?.elixhauser?.categories ? `"${result.scores.elixhauser.categories.join(', ').replace(/"/g, '""')}"` : ''
      const hccCategory = result.scores?.hcc?.category ? `HCC ${result.scores.hcc.category}` : ''

      const status = result.error ? 'Error' : 'Success'
      const escapedError = result.error ? `"${result.error?.replace(/"/g, '""') || ''}"` : ''

      csv.push(`${escapedCode},${escapedConvs},${charlsonScore},${charlsonCondition},${elixhauserCats},${hccCategory},${status},${escapedError}\n`)
    })

    const blob = new Blob([csv.join('')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `icd_batch_export_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {t('batchProcessing')}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          Please sign in to use batch processing features.
        </p>
        <a
          href="/login"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Sign In
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
        {t('batchProcessing')}
      </h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('text')}
            className={`
              whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'text'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}
            `}
          >
            Text Input
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`
              whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'file'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}
            `}
          >
            File Upload
          </button>
        </nav>
      </div>

      {/* Text Input Content */}
      {activeTab === 'text' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="card h-fit bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('codeEntry')}</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('conversionDirection')}
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center text-gray-700 dark:text-gray-300">
                      <input
                        type="radio"
                        value="icd10to9"
                        checked={direction === 'icd10to9'}
                        onChange={(e) => setDirection(e.target.value as any)}
                        className="mr-2"
                      />
                      ICD-10 → ICD-9
                    </label>
                    <label className="flex items-center text-gray-700 dark:text-gray-300">
                      <input
                        type="radio"
                        value="icd9to10"
                        checked={direction === 'icd9to10'}
                        onChange={(e) => setDirection(e.target.value as any)}
                        className="mr-2"
                      />
                      ICD-9 → ICD-10
                    </label>
                  </div>
                </div>

                <div>
                  <label htmlFor="codes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('codesLabel')}
                  </label>
                  <textarea
                    id="codes"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={direction === 'icd10to9'
                      ? t('codesPlaceholder10to9')
                      : t('codesPlaceholder9to10')
                    }
                    rows={12}
                    className="input font-mono text-sm w-full p-2 border rounded dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                    disabled={loading}
                  />
                </div>

                <button
                  onClick={handleProcessText}
                  disabled={loading || !input.trim()}
                  className="btn-primary w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('processing')}
                    </span>
                  ) : (
                    t('processCodes')
                  )}
                </button>
              </div>
            </div>

            {/* Results Section */}
            <div>
              {results.length > 0 ? (
                <BatchResultsTable results={results} onExport={handleExportText} />
              ) : (
                <div className="card flex flex-col items-center justify-center h-full min-h-[400px] text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-2 border-dashed border-gray-300 dark:border-gray-700">
                  <div className="text-6xl mb-4">📋</div>
                  <p className="text-lg">{t('noResultsYet')}</p>
                  <p className="text-sm mt-2 text-gray-400">Enter codes and click process to see results here</p>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="card mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">{t('batchTipsTitle')}</h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                  <li>{t('batchTip1')}</li>
                  <li>{t('batchTip2')}</li>
                  <li>{t('batchTip3')}</li>
                  <li>{t('batchTip4')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Upload Content */}
      {activeTab === 'file' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <BatchUpload onUploadSuccess={handleUploadSuccess} />
          </div>

          {/* History Section */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Processing History
            </h2>
            <BatchHistoryList refreshTrigger={refreshTrigger} />
          </div>
        </div>
      )}
    </div>
  )
}
