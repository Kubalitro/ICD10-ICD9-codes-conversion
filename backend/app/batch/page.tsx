'use client'

import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'

interface BatchResult {
  code: string
  conversions: string[]
  error?: string
}

export default function BatchPage() {
  const { t } = useLanguage()
  const [input, setInput] = useState('')
  const [direction, setDirection] = useState<'icd10to9' | 'icd9to10'>('icd10to9')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<BatchResult[]>([])

  const handleProcess = async () => {
    setLoading(true)
    setResults([])

    try {
      const codes = input
        .split(/[,\n]/)
        .map(c => c.trim())
        .filter(c => c.length > 0)

      const from = direction === 'icd10to9' ? 'icd10' : 'icd9'
      const to = direction === 'icd10to9' ? 'icd9' : 'icd10'

      const batchResults: BatchResult[] = []

      for (const code of codes) {
        try {
          const response = await fetch(`/api/convert?code=${code}&from=${from}&to=${to}`)
          const data = await response.json()

          if (response.ok && data.conversions) {
            batchResults.push({
              code,
              conversions: data.conversions.map((c: any) => c.targetCode)
            })
          } else {
            batchResults.push({
              code,
              conversions: [],
              error: t('noConversionFound')
            })
          }
        } catch (error) {
          batchResults.push({
            code,
            conversions: [],
            error: t('errorProcessing')
          })
        }
      }

      setResults(batchResults)
    } catch (error) {
      console.error('Batch processing error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    const csv = ['Código Original,Conversiones\n']
    results.forEach(result => {
      csv.push(`${result.code},"${result.conversions.join(', ')}"`)
      if (result.error) {
        csv.push(` [Error: ${result.error}]`)
      }
      csv.push('\n')
    })

    const blob = new Blob([csv.join('')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `icd_conversion_${Date.now()}.csv`
    a.click()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {t('batchProcessingTitle')}
        </h1>
        <p className="text-lg text-gray-600">
          {t('batchProcessingDesc')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('codeEntry')}</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('conversionDirection')}
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="icd10to9"
                    checked={direction === 'icd10to9'}
                    onChange={(e) => setDirection(e.target.value as any)}
                    className="mr-2"
                  />
                  ICD-10 → ICD-9
                </label>
                <label className="flex items-center">
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
              <label htmlFor="codes" className="block text-sm font-medium text-gray-700 mb-2">
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
                className="input font-mono text-sm"
                disabled={loading}
              />
            </div>

            <button
              onClick={handleProcess}
              disabled={loading || !input.trim()}
              className="btn-primary w-full disabled:opacity-50"
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
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">{t('results')}</h2>
            {results.length > 0 && (
              <button
                onClick={handleExport}
                className="btn-secondary text-sm"
              >
                {t('exportCSV')}
              </button>
            )}
          </div>

          {results.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">📋</div>
              <p>{t('noResultsYet')}</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${result.error ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                    }`}
                >
                  <div className="font-mono font-semibold text-gray-900 mb-2">
                    {result.code}
                  </div>
                  {result.error ? (
                    <div className="text-sm text-red-700">❌ {result.error}</div>
                  ) : (
                    <div className="text-sm text-gray-700">
                      ✅ {result.conversions.length} {t('conversionCount')}:{' '}
                      <span className="font-mono">{result.conversions.join(', ')}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="card mt-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">{t('batchTipsTitle')}</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>{t('batchTip1')}</li>
              <li>{t('batchTip2')}</li>
              <li>{t('batchTip3')}</li>
              <li>{t('batchTip4')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
