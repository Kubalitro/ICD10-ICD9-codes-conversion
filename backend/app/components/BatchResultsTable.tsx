'use client'

import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'

export interface BatchResult {
    code: string
    conversions: string[]
    error?: string
}

interface BatchResultsTableProps {
    results: BatchResult[]
    onExport: () => void
}

export default function BatchResultsTable({ results, onExport }: BatchResultsTableProps) {
    const { t } = useLanguage()
    const [filter, setFilter] = useState<'all' | 'success' | 'error'>('all')
    const [copied, setCopied] = useState(false)

    const filteredResults = results.filter(result => {
        if (filter === 'success') return !result.error
        if (filter === 'error') return !!result.error
        return true
    })

    const handleCopyAll = async () => {
        try {
            // Create tab-separated content for easy Excel pasting
            const header = `Original Code\tConversions\tStatus\n`
            const rows = results.map(r => {
                const status = r.error ? 'Error' : 'Success'
                const convs = r.conversions.join(', ')
                return `${r.code}\t${convs}\t${status}`
            }).join('\n')

            await navigator.clipboard.writeText(header + rows)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy', err)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    if (results.length === 0) return null

    return (
        <div className="card">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 no-print">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-gray-900">{t('results')}</h2>
                    <span className="text-sm text-gray-500">({results.length})</span>
                </div>

                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {/* Filter */}
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as any)}
                        className="input py-1.5 px-3 text-sm w-auto"
                    >
                        <option value="all">{t('showAll') || 'Show All'}</option>
                        <option value="success">{t('showSuccess') || 'Success Only'}</option>
                        <option value="error">{t('showErrors') || 'Errors Only'}</option>
                    </select>

                    {/* Actions */}
                    <button
                        onClick={handleCopyAll}
                        className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-2"
                        title="Copy to Clipboard"
                    >
                        {copied ? (
                            <>
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-green-600">Copied</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                                Copy
                            </>
                        )}
                    </button>

                    <button
                        onClick={onExport}
                        className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-2"
                        title="Export CSV"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        CSV
                    </button>

                    <button
                        onClick={handlePrint}
                        className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-2"
                        title="Print Results"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Print
                    </button>
                </div>
            </div>

            {/* Results List */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto print:max-h-none print:overflow-visible">
                {filteredResults.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No results match your filter.
                    </div>
                ) : (
                    filteredResults.map((result, index) => (
                        <div
                            key={index}
                            className={`border rounded-lg p-4 break-inside-avoid ${result.error
                                    ? 'bg-red-50 border-red-200 print:border-red-300'
                                    : 'bg-green-50 border-green-200 print:border-green-300'
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="font-mono font-bold text-gray-900 text-lg">
                                    {result.code}
                                </div>
                                <div className={`text-xs font-semibold px-2 py-1 rounded ${result.error ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                    }`}>
                                    {result.error ? 'ERROR' : 'SUCCESS'}
                                </div>
                            </div>

                            {result.error ? (
                                <div className="text-sm text-red-700 mt-2">
                                    {result.error}
                                </div>
                            ) : (
                                <div className="mt-2">
                                    <div className="text-sm text-gray-600 mb-1">{t('conversions') || 'Conversions'}:</div>
                                    <div className="font-mono text-gray-900 font-medium">
                                        {result.conversions.join(', ')}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Print Header (Hidden on screen) */}
            <div className="hidden print:block fixed top-0 left-0 w-full text-center border-b pb-4 mb-4">
                <h1 className="text-2xl font-bold">ICD Conversion Batch Report</h1>
                <p className="text-sm text-gray-500">{new Date().toLocaleString()}</p>
            </div>

            <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .card, .card * {
            visibility: visible;
          }
          .card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none;
            border: none;
          }
          .no-print {
            display: none !important;
          }
          .max-h-\\[600px\\] {
            max-height: none !important;
          }
          .overflow-y-auto {
            overflow: visible !important;
          }
        }
      `}</style>
        </div>
    )
}
