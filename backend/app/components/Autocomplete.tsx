'use client'

import { useState, useEffect, useRef } from 'react'
import { formatIcdCode } from '../utils/format-code'

interface AutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (code: string) => void
  disabled?: boolean
}

interface Suggestion {
  code: string
  description: string
  system: string
}

export default function Autocomplete({ value, onChange, onSelect, disabled }: AutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (value.length < 2) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      setLoading(true)
      try {
        // Buscar en la familia de códigos
        const response = await fetch(`/api/family?prefix=${value}`)
        if (response.ok) {
          const data = await response.json()
          setSuggestions(data.codes?.slice(0, 8) || [])
          setShowSuggestions(data.codes?.length > 0)
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error)
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(debounce)
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      handleSelect(suggestions[selectedIndex].code)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }
  }

  const handleSelect = (code: string) => {
    onChange(code)
    onSelect(code)
    setShowSuggestions(false)
    setSelectedIndex(-1)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        onKeyDown={handleKeyDown}
        placeholder="Ej: E10.10, E10, 25000, 250"
        className="input"
        disabled={disabled}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showSuggestions}
        aria-controls="autocomplete-list"
        aria-activedescendant={selectedIndex >= 0 ? `option-${selectedIndex}` : undefined}
      />

      {loading && (
        <div className="absolute right-3 top-3">
          <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <ul
          id="autocomplete-list"
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.code}
              id={`option-${index}`}
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => handleSelect(suggestion.code)}
              className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors cursor-pointer ${index === selectedIndex
                ? 'bg-blue-50'
                : 'hover:bg-gray-50'
                }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-semibold text-blue-600">
                      {formatIcdCode(suggestion.code, suggestion.system)}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {suggestion.system}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {suggestion.description || 'Sin descripción'}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
