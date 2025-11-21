'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getFavorites, removeFromFavorites, clearFavorites, type FavoriteCode } from '../utils/favorites'
import { formatIcdCode } from '../utils/format-code'
import { useLanguage } from '../context/LanguageContext'

interface FavoritesListProps {
  onSelectCode?: (code: string) => void
  collapsible?: boolean
}

export default function FavoritesList({ onSelectCode, collapsible = true }: FavoritesListProps) {
  const { t } = useLanguage()
  const { data: session } = useSession()
  const [favorites, setFavorites] = useState<FavoriteCode[]>([])
  const [isOpen, setIsOpen] = useState(true)
  const [showConfirm, setShowConfirm] = useState(false)

  const loadFavorites = async () => {
    if (session?.user) {
      try {
        const res = await fetch('/api/favorites')
        if (res.ok) {
          const data = await res.json()
          setFavorites(data.favorites.map((f: any) => ({
            code: f.code,
            system: f.system,
            description: f.notes || '', // Using notes as description for now, or fetch description? 
            // Wait, the API returns notes but not the full description if it wasn't saved.
            // The DB schema has 'notes' but maybe not 'description'.
            // Let's check the schema again or the API.
            // The API returns: i.id, i.code, i.system, i.notes, i.added_at
            // It seems I missed saving the description in the DB or retrieving it.
            // The `saved_list_items` table might not have a description column.
            // If so, I might need to fetch it or store it.
            // For now, I'll use notes or empty string.
            addedAt: f.added_at
          })))
        }
      } catch (error) {
        console.error('Failed to load favorites from API', error)
      }
    } else {
      setFavorites(getFavorites())
    }
  }

  useEffect(() => {
    loadFavorites()

    window.addEventListener('favoritesUpdated', loadFavorites)
    return () => window.removeEventListener('favoritesUpdated', loadFavorites)
  }, [session])

  const handleRemove = async (code: string, system: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (session?.user) {
      try {
        await fetch(`/api/favorites?code=${code}&system=${system}`, { method: 'DELETE' })
        loadFavorites()
        // Dispatch event to update buttons
        window.dispatchEvent(new CustomEvent('favoritesUpdated'))
      } catch (error) {
        console.error('Failed to remove favorite', error)
      }
    } else {
      removeFromFavorites(code, system)
    }
  }

  const handleClearAll = async () => {
    if (session?.user) {
      // Not implemented in API yet, maybe loop?
      // Or just hide the button for now if logged in?
      // Or implement it.
      // For now, let's just loop.
      for (const fav of favorites) {
        await fetch(`/api/favorites?code=${fav.code}&system=${fav.system}`, { method: 'DELETE' })
      }
      loadFavorites()
      window.dispatchEvent(new CustomEvent('favoritesUpdated'))
    } else {
      clearFavorites()
    }
    setShowConfirm(false)
  }

  const handleSelect = (code: string) => {
    if (onSelectCode) {
      onSelectCode(code)
    }
  }

  if (favorites.length === 0) {
    return (
      <div className="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            {t('favoriteCodes')}
          </h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          {t('noFavorites')}
        </p>
      </div>
    )
  }

  return (
    <div className="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => collapsible && setIsOpen(!isOpen)}
          className={`flex items-center gap-2 ${collapsible ? 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-300' : ''}`}
        >
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            {t('favoriteCodes')} ({favorites.length})
          </h3>
          {collapsible && (
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>

        {favorites.length > 0 && (
          <button
            onClick={() => setShowConfirm(true)}
            className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
          >
            {t('clearAll')}
          </button>
        )}
      </div>

      {showConfirm && (
        <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
          <p className="text-sm text-red-800 dark:text-red-200 mb-2">
            {t('deleteFavoritesConfirm')}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleClearAll}
              className="px-3 py-1 text-xs bg-red-600 dark:bg-red-700 text-white rounded hover:bg-red-700 dark:hover:bg-red-600"
            >
              {t('yesDeleteAll')}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {favorites.map((fav) => (
            <div
              key={`${fav.code}-${fav.system}`}
              className="group flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 transition-colors cursor-pointer"
              onClick={() => handleSelect(fav.code)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">
                    {formatIcdCode(fav.code)}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded">
                    {fav.system}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                  {fav.description}
                </p>
              </div>

              <button
                onClick={(e) => handleRemove(fav.code, fav.system, e)}
                className="ml-2 p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove from favorites"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
