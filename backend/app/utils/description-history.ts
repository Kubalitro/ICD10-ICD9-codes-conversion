/**
 * Description Search History Management
 * Stores and retrieves recent description searches using LocalStorage
 */

const STORAGE_KEY = 'icd_description_search_history'
const MAX_HISTORY_ITEMS = 10

export interface DescriptionHistoryItem {
  query: string
  timestamp: number
  resultsCount: number
}

/**
 * Get search history from LocalStorage
 * @returns Array of history items
 */
export function getDescriptionHistory(): DescriptionHistoryItem[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    
    const history: DescriptionHistoryItem[] = JSON.parse(stored)
    
    // Filter out old entries (older than 7 days)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
    return history.filter(item => item.timestamp > sevenDaysAgo)
  } catch (error) {
    console.error('Error reading description history:', error)
    return []
  }
}

/**
 * Add a search to history
 * @param query - The search query
 * @param resultsCount - Number of results found
 */
export function addToDescriptionHistory(query: string, resultsCount: number): void {
  if (typeof window === 'undefined') return
  if (!query.trim()) return
  
  try {
    let history = getDescriptionHistory()
    
    // Remove duplicate if exists (case-insensitive)
    history = history.filter(
      item => item.query.toLowerCase() !== query.toLowerCase()
    )
    
    // Add new item at the beginning
    history.unshift({
      query: query.trim(),
      timestamp: Date.now(),
      resultsCount
    })
    
    // Keep only MAX_HISTORY_ITEMS
    history = history.slice(0, MAX_HISTORY_ITEMS)
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch (error) {
    console.error('Error saving description history:', error)
  }
}

/**
 * Clear all search history
 */
export function clearDescriptionHistory(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Error clearing description history:', error)
  }
}

/**
 * Remove a specific item from history
 * @param query - The query to remove
 */
export function removeFromDescriptionHistory(query: string): void {
  if (typeof window === 'undefined') return
  
  try {
    let history = getDescriptionHistory()
    history = history.filter(
      item => item.query.toLowerCase() !== query.toLowerCase()
    )
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch (error) {
    console.error('Error removing from description history:', error)
  }
}

/**
 * Get popular/frequent searches
 * @param limit - Maximum number of items to return
 * @returns Most recent searches
 */
export function getPopularDescriptionSearches(limit: number = 5): DescriptionHistoryItem[] {
  const history = getDescriptionHistory()
  return history.slice(0, limit)
}

/**
 * Format timestamp for display
 * @param timestamp - Unix timestamp
 * @returns Formatted relative time string
 */
export function formatSearchTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  
  const minutes = Math.floor(diff / (60 * 1000))
  const hours = Math.floor(diff / (60 * 60 * 1000))
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  
  return new Date(timestamp).toLocaleDateString()
}
