'use client'

import { useState } from 'react'
import Autocomplete from './Autocomplete'
import { useLanguage } from '../context/LanguageContext'
import { formatIcdCode } from '../utils/format-code'

interface SearchBoxProps {
  onSearch: (code: string) => void
  loading: boolean
}

export default function SearchBox({ onSearch, loading }: SearchBoxProps) {
  const { t } = useLanguage()
  const [code, setCode] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (code.trim()) {
      onSearch(code.trim())
    }
  }

  const handleSelect = (selectedCode: string) => {
    onSearch(selectedCode)
  }

  return (
    <div className="card">
      <h2 className="card-header">{t('codeSearchHeader')}</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="code" className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
            {t('icdCodeLabel')}
          </label>
          <Autocomplete
            value={code}
            onChange={setCode}
            onSelect={handleSelect}
            disabled={loading}
          />
          <p className="mt-2 text-xs text-gray-500">
            {t('enterCodeInstruction')}
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t('searching')}
            </span>
          ) : (
            t('executeSearch')
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">{t('sampleQueries')}</h3>
        <div className="flex flex-wrap gap-2">
          {['E10', 'E10.10', 'I21', '250', '25000', '410'].map((example) => (
            <button
              key={example}
              onClick={() => {
                setCode(example)
                onSearch(example)
              }}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-mono bg-gray-50 hover:bg-gray-100 text-gray-700 rounded border border-gray-200 transition-colors disabled:opacity-50"
            >
              {formatIcdCode(example)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
