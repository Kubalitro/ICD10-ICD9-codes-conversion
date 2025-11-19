'use client'

import { useState, useEffect } from 'react'
import SearchBox from '../components/SearchBox'
import DescriptionSearch from '../components/DescriptionSearch'
import ResultsTabs from '../components/ResultsTabs'
import SearchHistory from '../components/SearchHistory'
import FavoritesList from '../components/FavoritesList'
import { ICDCode, ConversionResult, ElixhauserCategory, CharlsonResult } from '../types'
import { searchCode, convertCode, getElixhauser, getCharlson, searchFamily } from '../utils/api'
import { addToHistory, getHistory, clearHistory } from '../utils/history'
import { SearchHistory as SearchHistoryType } from '../types'

export default function SearchPage() {
  const [searchMode, setSearchMode] = useState<'code' | 'description'>('code')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    code: ICDCode
    conversions: ConversionResult[]
    elixhauser: { categories: ElixhauserCategory[], totalCategories: number } | null
    charlson: CharlsonResult | null
  } | null>(null)
  const [history, setHistory] = useState<SearchHistoryType[]>([])

  // Load history on client side only to prevent hydration mismatch
  useEffect(() => {
    setHistory(getHistory())
  }, [])

  const handleClearHistory = () => {
    clearHistory()
    setHistory([])
  }

  const handleSearch = async (code: string) => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Primero intentar búsqueda exacta
      let codeResult = await searchCode(code)

      // Si no encuentra, intentar búsqueda por familia
      if (!codeResult) {
        const familyResults = await searchFamily(code)
        if (familyResults.length > 0) {
          codeResult = {
            code: code,
            system: familyResults[0].system,
            description: `Familia de códigos (${familyResults.length} códigos encontrados)`,
            isFamily: true
          }
        }
      }

      if (!codeResult) {
        setError('No se encontró el código. Intenta con otro código o prefijo.')
        return
      }

      // Guardar en historial
      addToHistory(codeResult.code, codeResult.system)
      setHistory(getHistory())

      // Obtener conversiones
      const system = codeResult.system === 'ICD-10-CM' ? 'icd10' : 'icd9'
      const targetSystem = system === 'icd10' ? 'icd9' : 'icd10'
      const conversionResult = await convertCode(codeResult.code.replace('.', ''), system, targetSystem)

      // Obtener Elixhauser
      const elixhauserResult = await getElixhauser(codeResult.code.replace('.', ''))

      // Obtener Charlson
      const charlsonResult = await getCharlson(codeResult.code.replace('.', ''), system)

      setResult({
        code: codeResult,
        conversions: conversionResult?.conversions || [],
        elixhauser: elixhauserResult,
        charlson: charlsonResult
      })

    } catch (err) {
      setError('Ocurrió un error al buscar el código. Por favor, inténtalo de nuevo.')
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Professional Header */}
      <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          ICD Code Converter System
        </h1>
        <p className="text-base text-gray-600 dark:text-gray-400 max-w-3xl">
          Medical diagnostic code conversion tool for ICD-10-CM and ICD-9-CM with integrated comorbidity classification (Elixhauser & Charlson Index)
        </p>
        <div className="mt-4 flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-2">
            <span className="status-indicator status-active"></span>
            System Operational
          </span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span className="font-mono">Database: 74,719 ICD-10-CM codes</span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span className="font-mono">14,568 ICD-9-CM codes</span>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Search */}
        <div className="lg:col-span-1 space-y-6">
          {/* Search Mode Tabs */}
          <div className="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setSearchMode('code')}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${searchMode === 'code'
                  ? 'border-blue-900 dark:border-blue-600 text-blue-900 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
              >
                Search by Code
              </button>
              <button
                onClick={() => setSearchMode('description')}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${searchMode === 'description'
                  ? 'border-blue-900 dark:border-blue-600 text-blue-900 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
              >
                Search by Description
              </button>
            </div>
          </div>

          {/* Search Components */}
          {searchMode === 'code' ? (
            <SearchBox onSearch={handleSearch} loading={loading} />
          ) : (
            <DescriptionSearch onSelect={handleSearch} loading={loading} />
          )}

          {/* Favorites List */}
          <FavoritesList onSelectCode={handleSearch} />

          {/* Search History */}
          <SearchHistory history={history} onSelect={handleSearch} onClear={handleClearHistory} />
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-2">
          {error && (
            <div className="card bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-red-900 dark:text-red-200 mb-1">ERROR</h3>
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && !result && (
            <div className="card bg-white dark:bg-gray-800 text-center py-12">
              <h3 className="card-header text-center border-0 mb-4">Search Instructions</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Enter an ICD-10-CM or ICD-9-CM code in the search field to begin analysis
              </p>
              <div className="text-left max-w-md mx-auto text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <div><span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">E10.10</span> - Specific code search</div>
                <div><span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">E10</span> - Family code search</div>
              </div>
            </div>
          )}

          {result && (
            <ResultsTabs
              code={result.code}
              conversions={result.conversions}
              elixhauser={result.elixhauser}
              charlson={result.charlson}
            />
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div className="card bg-white dark:bg-gray-800">
          <h3 className="card-header">Bidirectional Conversion</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Converts codes between ICD-10-CM and ICD-9-CM using official CMS General Equivalence Mappings (GEMs).
          </p>
        </div>

        <div className="card bg-white dark:bg-gray-800">
          <h3 className="card-header">Elixhauser Comorbidities</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Classification into 39 comorbidity categories based on AHRQ methodology for risk adjustment.
          </p>
        </div>

        <div className="card bg-white dark:bg-gray-800">
          <h3 className="card-header">Charlson Index</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Calculates comorbidity score for mortality prediction and patient risk stratification.
          </p>
        </div>
      </div>
    </div>
  )
}
