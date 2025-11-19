import { SearchHistory } from '../types'

const HISTORY_KEY = 'icd_search_history'
const MAX_HISTORY = 5

export function getHistory(): SearchHistory[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(HISTORY_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function addToHistory(code: string, system: string): void {
  if (typeof window === 'undefined') return
  
  const history = getHistory()
  const newEntry: SearchHistory = {
    code,
    system,
    timestamp: Date.now()
  }
  
  // Remove duplicates
  const filtered = history.filter(h => h.code !== code)
  
  // Add new entry at the beginning
  const updated = [newEntry, ...filtered].slice(0, MAX_HISTORY)
  
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(HISTORY_KEY)
}
