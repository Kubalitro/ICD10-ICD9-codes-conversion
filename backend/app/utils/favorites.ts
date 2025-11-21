// Favorites management utility using LocalStorage

export interface FavoriteCode {
  code: string
  system: 'ICD-10-CM' | 'ICD-9-CM'
  description: string
  addedAt: string // ISO timestamp
}

const FAVORITES_KEY = 'icd_favorites'

/**
 * Get all favorite codes from LocalStorage
 */
export function getFavorites(): FavoriteCode[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(FAVORITES_KEY)
    if (!stored) return []

    const favorites = JSON.parse(stored) as FavoriteCode[]
    // Sort by most recently added
    return favorites.sort((a, b) =>
      new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
    )
  } catch (error) {
    console.error('Error reading favorites:', error)
    return []
  }
}

/**
 * Add a code to favorites
 */
export function addToFavorites(
  code: string,
  system: 'ICD-10-CM' | 'ICD-9-CM',
  description: string
): void {
  if (typeof window === 'undefined') return

  try {
    const favorites = getFavorites()

    // Check if already exists
    const exists = favorites.some(fav =>
      fav.code === code && fav.system === system
    )

    if (exists) {

      return
    }

    const newFavorite: FavoriteCode = {
      code,
      system,
      description,
      addedAt: new Date().toISOString()
    }

    const updated = [newFavorite, ...favorites]

    // Limit to 50 favorites
    if (updated.length > 50) {
      updated.pop()
    }

    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated))

    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('favoritesUpdated'))
  } catch (error) {
    console.error('Error adding to favorites:', error)
  }
}

/**
 * Remove a code from favorites
 */
export function removeFromFavorites(code: string, system: string): void {
  if (typeof window === 'undefined') return

  try {
    const favorites = getFavorites()
    const updated = favorites.filter(fav =>
      !(fav.code === code && fav.system === system)
    )

    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated))

    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('favoritesUpdated'))
  } catch (error) {
    console.error('Error removing from favorites:', error)
  }
}

/**
 * Check if a code is in favorites
 */
export function isFavorite(code: string, system: string): boolean {
  const favorites = getFavorites()
  return favorites.some(fav => fav.code === code && fav.system === system)
}

/**
 * Clear all favorites
 */
export function clearFavorites(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(FAVORITES_KEY)
    window.dispatchEvent(new CustomEvent('favoritesUpdated'))
  } catch (error) {
    console.error('Error clearing favorites:', error)
  }
}

/**
 * Get favorites count
 */
export function getFavoritesCount(): number {
  return getFavorites().length
}
