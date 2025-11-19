import { ICDCode, ConversionResult, ElixhauserCategory, CharlsonResult } from '../types'

const API_BASE = '/api'

export async function searchCode(code: string, fuzzy: boolean = false): Promise<ICDCode | null> {
  try {
    const params = new URLSearchParams({ code })
    if (fuzzy) params.append('fuzzy', 'true')
    
    const response = await fetch(`${API_BASE}/search?${params}`)
    if (!response.ok) return null
    
    return await response.json()
  } catch (error) {
    console.error('Error searching code:', error)
    return null
  }
}

export async function searchFamily(prefix: string): Promise<ICDCode[]> {
  try {
    const response = await fetch(`${API_BASE}/family?prefix=${prefix}`)
    if (!response.ok) return []
    
    const data = await response.json()
    return data.codes || []
  } catch (error) {
    console.error('Error searching family:', error)
    return []
  }
}

export async function convertCode(
  code: string, 
  from: 'icd10' | 'icd9', 
  to: 'icd10' | 'icd9'
): Promise<{ conversions: ConversionResult[], isFamily?: boolean, familyData?: any } | null> {
  try {
    const response = await fetch(
      `${API_BASE}/convert?code=${code}&from=${from}&to=${to}`
    )
    if (!response.ok) return null
    
    const data = await response.json()
    
    // If it's a family conversion, normalize the response structure
    if (data.isFamilyConversion) {
      return {
        conversions: data.allConversions || [],
        isFamily: true,
        familyData: {
          sourceFamilyCount: data.sourceFamilyCount,
          targetFamilies: data.targetFamilies,
          targetFamiliesCount: data.targetFamiliesCount,
          sourceFamilyCodes: data.sourceFamilyCodes
        }
      }
    }
    
    return data
  } catch (error) {
    console.error('Error converting code:', error)
    return null
  }
}

export async function getElixhauser(code: string): Promise<{
  categories: ElixhauserCategory[]
  totalCategories: number
} | null> {
  try {
    const response = await fetch(`${API_BASE}/elixhauser?code=${code}`)
    if (!response.ok) return null
    
    return await response.json()
  } catch (error) {
    console.error('Error getting Elixhauser:', error)
    return null
  }
}

export async function getCharlson(code: string, system: 'icd10' | 'icd9'): Promise<CharlsonResult | null> {
  try {
    const response = await fetch(`${API_BASE}/charlson?code=${code}&system=${system}`)
    if (!response.ok) return null
    
    return await response.json()
  } catch (error) {
    console.error('Error getting Charlson:', error)
    return null
  }
}
