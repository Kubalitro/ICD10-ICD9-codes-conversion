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

    // PHASE 3 FEATURE: Add comorbidity scores to results
    // Get all ICD-10 codes for batch score lookup
    const icd10Codes = topResults
      .filter(r => r.system === 'ICD-10-CM')
      .map(r => r.code.replace(/\./g, '')) // Remove dots for consistency

    const scoreMap = new Map<string, any>()

    if (icd10Codes.length > 0) {
      // Batch query Charlson scores
      try {
        const charlsonResults = await sql`
          SELECT code, condition, score
          FROM charlson_icd10
          WHERE code = ANY(${icd10Codes})
        `
        charlsonResults.forEach((row: any) => {
          if (!scoreMap.has(row.code)) {
            scoreMap.set(row.code, {})
          }
          scoreMap.get(row.code)!.charlson = {
            score: row.score,
            condition: row.condition
          }
        })
      } catch (e) {
        console.error('Charlson batch query error:', e)
      }

      // Batch query Elixhauser scores
      try {
        const elixhauserResults = await sql`
          SELECT 
            em.icd10_code,
            ec.code as category_code,
            ec.name as category_name
          FROM elixhauser_mappings em
          JOIN elixhauser_categories ec ON em.category_code = ec.code
          WHERE em.icd10_code = ANY(${icd10Codes})
        `

        elixhauserResults.forEach((row: any) => {
          if (!scoreMap.has(row.icd10_code)) {
            scoreMap.set(row.icd10_code, {})
          }
          if (!scoreMap.get(row.icd10_code)!.elixhauser) {
            scoreMap.get(row.icd10_code)!.elixhauser = {
              count: 0,
              categories: []
            }
          }
          scoreMap.get(row.icd10_code)!.elixhauser.categories.push(row.category_name)
          scoreMap.get(row.icd10_code)!.elixhauser.count++
        })
      } catch (e) {
        console.error('Elixhauser batch query error:', e)
      }

      // Batch query HCC scores
      try {
        const hccResults = await sql`
          SELECT icd10_code, hcc_category
          FROM hcc_mappings
          WHERE icd10_code = ANY(${icd10Codes})
        `
        hccResults.forEach((row: any) => {
          if (!scoreMap.has(row.icd10_code)) {
            scoreMap.set(row.icd10_code, {})
          }
          scoreMap.get(row.icd10_code)!.hcc = {
            category: row.hcc_category
          }
        })
      } catch (e) {
        console.error('HCC batch query error:', e)
      }
    }

    // Attach scores to results
    const resultsWithScores = topResults.map(result => {
      const cleanCode = result.code.replace(/\./g, '')
      const scores = scoreMap.get(cleanCode)

      return {
        ...result,
        scores: scores || null
      }
    })

    // PHASE 2 FEATURE: Get suggestions for typos
    const didYouMean = topResults.length === 0 ? getDidYouMeanSuggestions(query) : []

    // PHASE 2 FEATURE: Get synonym suggestions for user education
    const synonymSuggestions = getSynonymSuggestions(query)

    return NextResponse.json({
      query,
      count: resultsWithScores.length,
      results: resultsWithScores,
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
