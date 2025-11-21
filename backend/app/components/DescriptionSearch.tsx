'use client'

import { useState } from 'react'
import { addToDescriptionHistory } from '../utils/description-history'
import DescriptionHistory from './DescriptionHistory'
import { useLanguage } from '../context/LanguageContext'

interface DescriptionSearchResult {
  code: string
  system: string
  description: string
  relevance: number
}

interface EnhancedSearchResponse {
  query: string
  count: number
  results: DescriptionSearchResult[]
  expandedQueries?: string[]
  synonymSuggestions?: string[]
  didYouMean?: string[]
}

interface DescriptionSearchProps {
  onSelect: (code: string) => void
  loading: boolean
}

export default function DescriptionSearch({ onSelect, loading }: DescriptionSearchProps) {
  const { t } = useLanguage()
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<DescriptionSearchResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [expandedQueries, setExpandedQueries] = useState<string[]>([])
  const [synonymSuggestions, setSynonymSuggestions] = useState<string[]>([])
  const [didYouMean, setDidYouMean] = useState<string[]>([])
  const [historyKey, setHistoryKey] = useState(0)

  const handleSearch = async (searchQuery?: string) => {
    const queryToSearch = searchQuery || query

    if (!queryToSearch.trim() || queryToSearch.trim().length < 2) {
      setError('Please enter at least 2 characters')
      return
    }

    setSearching(true)
    setError(null)
    setResults([])
    setExpandedQueries([])
    setSynonymSuggestions([])
    setDidYouMean([])

    try {
      // Use Phase 2 enhanced endpoint
      const response = await fetch(`/api/search-description-enhanced?query=${encodeURIComponent(queryToSearch.trim())}`)

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data: EnhancedSearchResponse = await response.json()

      if (data.results && data.results.length > 0) {
        setResults(data.results)

        // Save to history
        addToDescriptionHistory(queryToSearch.trim(), data.count)

        // Trigger history component to reload
        setHistoryKey(prev => prev + 1)

        // Phase 2: Set expanded queries
        if (data.expandedQueries && data.expandedQueries.length > 1) {
          setExpandedQueries(data.expandedQueries)
        }

        // Phase 2: Set synonym suggestions
        if (data.synonymSuggestions && data.synonymSuggestions.length > 0) {
          setSynonymSuggestions(data.synonymSuggestions)
        }
      } else {
        setError(t('noConversionsFound')) // Reusing existing error or add a new one if needed

        // Phase 2: Set "Did you mean?" suggestions
        if (data.didYouMean && data.didYouMean.length > 0) {
          setDidYouMean(data.didYouMean)
        }
      }
    } catch (err) {
      setError(t('searchError'))
      console.error('Description search error:', err)
    } finally {
      setSearching(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch()
  }

  const handleHistorySelect = (historicalQuery: string) => {
    setQuery(historicalQuery)
    handleSearch(historicalQuery)
  }

  const handleDidYouMeanClick = (suggestion: string) => {
    setQuery(suggestion)
    handleSearch(suggestion)
  }

  return (
    <div className="card">
      <h2 className="card-header">{t('searchByDescriptionHeader')}</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="description" className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
            {t('clinicalConditionLabel')}
          </label>
          <input
            type="text"
            id="description"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading || searching}
            placeholder={t('descriptionPlaceholder')}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed text-sm"
          />
          <p className="mt-2 text-xs text-gray-500">
            💡 {t('descriptionSearchTip')}
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || searching || !query.trim() || query.trim().length < 2}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {searching ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t('searchingWithAI')}
            </span>
          ) : (
            `🔍 ${t('descriptionSearchButton')}`
          )}
        </button>
      </form>

      {/* Phase 2: Synonym Suggestions */}
      {synonymSuggestions.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900 mb-1">
                ℹ️ {t('expandedWithSynonyms')}
              </p>
              <div className="flex flex-wrap gap-2">
                {synonymSuggestions.map((synonym, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                  >
                    {synonym}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phase 2: Expanded Queries Info */}
      {expandedQueries.length > 1 && (
        <div className="mt-3 p-2.5 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
          <strong>{t('searchedFor')}</strong> {expandedQueries.join(', ')}
        </div>
      )}

      {/* Did You Mean? */}
      {didYouMean.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-900 mb-2">
                {t('didYouMean')}
              </p>
              <div className="flex flex-wrap gap-2">
                {didYouMean.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleDidYouMeanClick(suggestion)}
                    className="px-3 py-1.5 text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-900 rounded border border-yellow-300 transition-colors font-medium"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && !didYouMean.length && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
            {t('foundMatchingCodes')} ({results.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <button
                key={index}
                onClick={() => {
                  onSelect(result.code)
                  setResults([])
                  setQuery('')
                  setExpandedQueries([])
                  setSynonymSuggestions([])
                }}
                disabled={loading}
                className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-all disabled:opacity-50 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-mono font-semibold text-gray-900">
                        {result.code}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded">
                        {result.system}
                      </span>
                      {result.relevance > 0.8 && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                          {t('highMatch')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {result.description}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Phase 2: Search History */}
      <DescriptionHistory key={historyKey} onSelect={handleHistorySelect} />

      {/* Sample Queries */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
          {t('sampleDescriptions')}
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            'MI',
            'CHF',
            'DM with ketoacidosis',
            'acute HTN',
            'CKD stage 3',
            'COPD exacerbation',
            'UTI',
            'CVA'
          ].map((example) => (
            <button
              key={example}
              onClick={() => {
                setQuery(example)
              }}
              disabled={loading || searching}
              className="px-3 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 rounded border border-gray-200 transition-colors disabled:opacity-50"
            >
              {example}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-500">
          💡 <strong>{t('proTip')}</strong>
        </p>
      </div>
    </div>
  )
}




