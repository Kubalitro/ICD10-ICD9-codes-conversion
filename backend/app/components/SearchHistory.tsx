'use client'

import { useLanguage } from '../context/LanguageContext'
import { SearchHistory as SearchHistoryType } from '../types'
import { Clock, Trash2 } from 'lucide-react' // Assuming these icons are from lucide-react

interface SearchHistoryProps {
  history: SearchHistoryType[]
  onSelect: (code: string) => void
  onClear: () => void
}

export default function SearchHistory({ history, onSelect, onClear }: SearchHistoryProps) {
  const { t } = useLanguage()

  if (history.length === 0) {
    return null
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {t('searchHistory')}
        </h3>
        <button
          onClick={onClear}
          className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          {t('clearHistory')}
        </button>
      </div>

      <div className="space-y-1.5 mt-4">
        {history.map((item, index) => (
          <button
            key={index}
            onClick={() => onSelect(item.code)}
            className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-sm font-semibold text-gray-900">{item.code}</span>
                <span className="ml-2 text-xs text-gray-500 font-mono">{item.system}</span>
              </div>
              <span className="text-xs text-gray-400 font-mono">
                {new Date(item.timestamp).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
