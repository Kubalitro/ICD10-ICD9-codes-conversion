/**
 * Fuzzy Matching Utilities
 * Implements Levenshtein distance algorithm for handling typos and misspellings
 */

/**
 * Calculate Levenshtein distance between two strings
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Distance (number of edits needed)
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length
  const len2 = str2.length
  
  // Create matrix
  const matrix: number[][] = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0))
  
  // Initialize first row and column
  for (let i = 0; i <= len1; i++) matrix[i][0] = i
  for (let j = 0; j <= len2; j++) matrix[0][j] = j
  
  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      )
    }
  }
  
  return matrix[len1][len2]
}

/**
 * Calculate similarity ratio between two strings (0 to 1)
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Similarity ratio (1 = identical, 0 = completely different)
 */
export function similarityRatio(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase())
  const maxLen = Math.max(str1.length, str2.length)
  
  if (maxLen === 0) return 1
  
  return 1 - (distance / maxLen)
}

/**
 * Find the best matching string from a list
 * @param query - Query string
 * @param candidates - List of candidate strings
 * @param threshold - Minimum similarity threshold (0 to 1)
 * @returns Best match or null if none above threshold
 */
export function findBestMatch(
  query: string, 
  candidates: string[], 
  threshold: number = 0.7
): { match: string; score: number } | null {
  let bestMatch: string | null = null
  let bestScore = 0
  
  for (const candidate of candidates) {
    const score = similarityRatio(query, candidate)
    if (score > bestScore && score >= threshold) {
      bestScore = score
      bestMatch = candidate
    }
  }
  
  return bestMatch ? { match: bestMatch, score: bestScore } : null
}

/**
 * Find all matches above a threshold
 * @param query - Query string
 * @param candidates - List of candidate strings
 * @param threshold - Minimum similarity threshold (0 to 1)
 * @returns Array of matches with scores
 */
export function findAllMatches(
  query: string,
  candidates: string[],
  threshold: number = 0.7
): Array<{ match: string; score: number }> {
  const matches: Array<{ match: string; score: number }> = []
  
  for (const candidate of candidates) {
    const score = similarityRatio(query, candidate)
    if (score >= threshold) {
      matches.push({ match: candidate, score })
    }
  }
  
  // Sort by score descending
  return matches.sort((a, b) => b.score - a.score)
}

/**
 * Check if a query has likely typos based on common medical terms
 * @param query - Query string
 * @param commonTerms - List of common medical terms
 * @returns Suggested corrections
 */
export function suggestCorrections(
  query: string,
  commonTerms: string[]
): string[] {
  const queryWords = query.toLowerCase().split(/\s+/)
  const suggestions: string[] = []
  
  for (const word of queryWords) {
    // Skip very short words
    if (word.length < 4) continue
    
    const match = findBestMatch(word, commonTerms, 0.75)
    if (match && match.match !== word) {
      suggestions.push(match.match)
    }
  }
  
  return suggestions
}

/**
 * Common medical terms for typo detection
 */
export const COMMON_MEDICAL_TERMS = [
  // Conditions
  'diabetes', 'hypertension', 'pneumonia', 'asthma', 'copd',
  'myocardial', 'infarction', 'stroke', 'seizure', 'fracture',
  'infection', 'inflammation', 'cancer', 'tumor', 'carcinoma',
  'failure', 'disease', 'syndrome', 'disorder', 'insufficiency',
  
  // Anatomical
  'heart', 'lung', 'kidney', 'liver', 'brain', 'spleen',
  'cardiac', 'pulmonary', 'renal', 'hepatic', 'cerebral',
  'coronary', 'arterial', 'venous', 'vascular',
  
  // Descriptors
  'acute', 'chronic', 'severe', 'mild', 'moderate',
  'primary', 'secondary', 'tertiary',
  'unspecified', 'specified', 'without', 'with',
  
  // Common abbreviations (full form)
  'congestive', 'obstructive', 'ischemic', 'hemorrhagic',
  'thrombosis', 'embolism', 'stenosis', 'occlusion',
  'ketoacidosis', 'nephropathy', 'retinopathy', 'neuropathy'
]

/**
 * Fuzzy search helper - checks if query approximately matches target
 * @param query - Search query
 * @param target - Target string to match against
 * @param threshold - Similarity threshold (default 0.8)
 * @returns True if strings are similar enough
 */
export function fuzzyMatches(
  query: string,
  target: string,
  threshold: number = 0.8
): boolean {
  return similarityRatio(query, target) >= threshold
}

/**
 * Get "Did you mean?" suggestions for a query
 * @param query - Original query
 * @param threshold - Similarity threshold
 * @returns Array of suggestions
 */
export function getDidYouMeanSuggestions(query: string, threshold: number = 0.75): string[] {
  const corrections = suggestCorrections(query, COMMON_MEDICAL_TERMS)
  
  if (corrections.length === 0) return []
  
  // Rebuild query with corrections
  const queryWords = query.toLowerCase().split(/\s+/)
  const suggestions: Set<string> = new Set()
  
  corrections.forEach(correction => {
    const newQuery = queryWords.map(word => {
      const match = findBestMatch(word, [correction], threshold)
      return match ? correction : word
    }).join(' ')
    
    if (newQuery !== query.toLowerCase()) {
      suggestions.add(newQuery)
    }
  })
  
  return Array.from(suggestions)
}
