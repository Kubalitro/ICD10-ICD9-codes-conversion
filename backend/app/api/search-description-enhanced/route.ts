/**
 * API Endpoint: /api/search-description-enhanced
 * Search for ICD codes by clinical description
 * PHASE 2: Supports synonyms and fuzzy matching
 */

import { NextRequest, NextResponse } from 'next/server'
import { sql, handleDbError } from '../../../lib/db'
import { expandQueryWithSynonyms, getSynonymSuggestions } from '../../utils/medical-synonyms'
import { getDidYouMeanSuggestions } from '../../utils/fuzzy-match'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query')
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters' },
        { status: 400 }
      )
    }
    
    // PHASE 2 FEATURE: Expand query with synonyms
    // Example: "MI" → ["mi", "myocardial infarction", "heart attack"]
    const expandedQueries = expandQueryWithSynonyms(query)
    console.log(`Original query: "${query}", Expanded: `, expandedQueries)
    
    const searchTerms = query.trim().toLowerCase().split(/\s+/)
    
    // Search in ICD-10-CM descriptions using expanded queries (with synonyms)
    // Using word boundary regex for proper matching (not substring)
    // This prevents matching "MI" in "miosis" or "anosmia"
    const allIcd10Results: any[] = []
    
    for (const expandedQuery of expandedQueries) {
      const searchPattern = expandedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const results = await sql`
        SELECT code, description
        FROM icd10_codes
        WHERE description ~* ${`(^|[^a-z])${searchPattern}([^a-z]|$)`}
        ORDER BY LENGTH(description)
        LIMIT 20
      `
      allIcd10Results.push(...results)
    }
    
    // Remove duplicates by code
    const uniqueIcd10Map = new Map()
    allIcd10Results.forEach(row => {
      if (!uniqueIcd10Map.has(row.code)) {
        uniqueIcd10Map.set(row.code, row)
      }
    })
    const icd10Results = Array.from(uniqueIcd10Map.values())
    
    // ICD-9 search (optional)
    let icd9Results: any[] = []
    try {
      icd9Results = await sql`
        SELECT code, '' as description
        FROM icd9_codes
        WHERE code ILIKE ${'%' + query.trim() + '%'}
        LIMIT 10
      `
    } catch (e) {
      console.log('ICD-9 search skipped:', e)
    }
    
    // Combine results and calculate relevance
    const allResults = [...icd10Results, ...icd9Results].map(row => {
      const desc = (row.description || '').toLowerCase()
      let relevance = 0
      
      // Exact phrase match
      if (desc.includes(query.toLowerCase())) {
        relevance = 1.0
      } else {
        // Check against expanded queries for synonym matches
        for (const expandedQuery of expandedQueries) {
          if (desc.includes(expandedQuery)) {
            relevance = Math.max(relevance, 0.9) // High relevance for synonym matches
            break
          }
        }
        
        // Fallback: Calculate relevance based on matching terms
        if (relevance === 0) {
          const matchCount = searchTerms.filter(term => desc.includes(term)).length
          relevance = matchCount / searchTerms.length
        }
      }
      
      return {
        code: row.code,
        system: icd10Results.includes(row) ? 'ICD-10-CM' : 'ICD-9-CM',
        description: row.description || `ICD code ${row.code}`,
        relevance
      }
    })
    
    // Sort by relevance (highest first), then by description length
    allResults.sort((a, b) => {
      if (b.relevance !== a.relevance) {
        return b.relevance - a.relevance
      }
      return a.description.length - b.description.length
    })
    
    // Limit to top 15 results
    const topResults = allResults.slice(0, 15)
    
    // PHASE 2 FEATURE: Get suggestions for typos
    const didYouMean = topResults.length === 0 ? getDidYouMeanSuggestions(query) : []
    
    // PHASE 2 FEATURE: Get synonym suggestions for user education
    const synonymSuggestions = getSynonymSuggestions(query)
    
    return NextResponse.json({
      query,
      count: topResults.length,
      results: topResults,
      // Include expanded queries if synonyms were used
      expandedQueries: expandedQueries.length > 1 ? expandedQueries : undefined,
      // "Did you mean?" suggestions for typos
      didYouMean: didYouMean.length > 0 ? didYouMean : undefined,
      // Show full terms for abbreviations
      synonymSuggestions: synonymSuggestions.length > 0 ? synonymSuggestions : undefined
    })
    
  } catch (error) {
    console.error('Description search error:', error)
    return NextResponse.json(
      handleDbError(error),
      { status: 500 }
    )
  }
}
