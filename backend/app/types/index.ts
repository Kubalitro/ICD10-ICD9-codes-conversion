export interface ICDCode {
  code: string
  system: 'ICD-10-CM' | 'ICD-9-CM'
  description?: string
  isFamily?: boolean
}

export interface ConversionResult {
  targetCode: string
  approximate: boolean
  noMap: boolean
  description?: string
  sourceCode?: string
  sourceDescription?: string
}

export interface ElixhauserCategory {
  code: string
  name: string
  description: string
}

export interface CharlsonResult {
  code: string
  system: string
  condition: string
  score: number
  matchType: 'exact' | 'family'
}

export interface SearchHistory {
  code: string
  system: string
  timestamp: number
}
