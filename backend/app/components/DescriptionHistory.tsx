'use client'

import { useEffect, useState } from 'react'
import { 
  getDescriptionHistory, 
  clearDescriptionHistory,
  removeFromDescriptionHistory,
  formatSearchTime,
  DescriptionHistoryItem 
} from '../utils/description-history'

interface DescriptionHistoryProps {
  onSelect: (query: string) => void
}

export default function DescriptionHistory({ onSelect }: DescriptionHistoryProps) {
  const [history, setHistory] = useState<DescriptionHistoryItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  
  useEffect(() => {
    loadHistory()
  }, [])
  
  const loadHistory = () => {
    setHistory(getDescriptionHistory())
  }
  
  const handleClear = () => {
    if (confirm('Clear all description search history?')) {
      clearDescriptionHistory()
      setHistory([])
    }
  }
  
  const handleRemove = (query: string) => {
    removeFromDescriptionHistory(query)
    loadHistory()
  }
  
  if (history.length === 0) {
    return null
  }
  
  return (
    <div className="mt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Recent Searches ({history.length})</span>
        </div>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="mt-2 bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Search History
            </span>
            <button
              onClick={handleClear}
              className="text-xs text-red-600 hover:text-red-700 font-medium"
            >
              Clear All
            </button>
          </div>
          
          <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
            {history.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 group"
              >
                <button
                  onClick={() => {
                    onSelect(item.query)
                    setIsOpen(false)
                  }}
                  className="flex-1 text-left flex items-center gap-3"
                >
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{item.query}</p>
                    <p className="text-xs text-gray-500">
                      {item.resultsCount} result{item.resultsCount !== 1 ? 's' : ''} • {formatSearchTime(item.timestamp)}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => handleRemove(item.query)}
                  className="ml-2 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove from history"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
