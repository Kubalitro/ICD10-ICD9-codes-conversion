'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '../context/LanguageContext'
import { addToFavorites, removeFromFavorites, isFavorite as checkIsFavorite } from '../utils/favorites'

interface FavoriteButtonProps {
  code: string
  system: 'ICD-10-CM' | 'ICD-9-CM'
  description: string
  compact?: boolean
  className?: string
}

export default function FavoriteButton({ code, description, system, compact = false, className = '' }: FavoriteButtonProps) {
  const { t } = useLanguage()
  const { data: session } = useSession()
  const [isFavorite, setIsFavorite] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const checkStatus = async () => {
    if (session?.user) {
      try {
        const res = await fetch('/api/favorites')
        if (res.ok) {
          const data = await res.json()
          const found = data.favorites.some((f: any) => f.code === code && f.system === system)
          setIsFavorite(found)
        }
      } catch (error) {
        console.error('Failed to check favorite status', error)
      }
    } else {
      setIsFavorite(checkIsFavorite(code, system))
    }
  }

  useEffect(() => {
    checkStatus()
  }, [code, system, session])

  useEffect(() => {
    const handleUpdate = () => {
      checkStatus()
    }

    window.addEventListener('favoritesUpdated', handleUpdate)
    return () => window.removeEventListener('favoritesUpdated', handleUpdate)
  }, [code, system, session])

  const handleToggle = async () => {
    setIsAnimating(true)

    if (session?.user) {
      try {
        if (isFavorite) {
          await fetch(`/api/favorites?code=${code}&system=${system}`, { method: 'DELETE' })
        } else {
          await fetch('/api/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, system, notes: description }) // Saving description as notes for now
          })
        }
        // Dispatch event to update other components
        window.dispatchEvent(new CustomEvent('favoritesUpdated'))
        checkStatus()
      } catch (error) {
        console.error('Failed to toggle favorite', error)
      }
    } else {
      if (isFavorite) {
        removeFromFavorites(code, system)
      } else {
        addToFavorites(code, system, description)
      }
    }

    setTimeout(() => setIsAnimating(false), 300)
  }

  if (compact) {
    return (
      <button
        onClick={handleToggle}
        className={`p-2 rounded-full transition-colors ${isFavorite
          ? 'text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
          : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-100 dark:hover:bg-gray-800'
          } ${className}`}
        title={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
        aria-label={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
      >
        <svg className={`w-5 h-5 ${isAnimating ? 'scale-125' : 'scale-100'}`} fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      </button>
    )
  }

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 font-medium text-sm ${isFavorite
        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
        } ${isAnimating ? 'scale-125' : 'scale-100'}`}
      title={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
    >
      <svg
        className={`w-5 h-5 transition-transform ${isAnimating ? 'rotate-12' : ''}`}
        fill={isFavorite ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
      {isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
    </button>
  )
}
