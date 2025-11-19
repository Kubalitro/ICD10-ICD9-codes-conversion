'use client'

import { useState } from 'react'
import { ICDCode, ConversionResult, ElixhauserCategory, CharlsonResult } from '../types'
import ClinicalAlerts from './ClinicalAlerts'
import QuickActions from './QuickActions'
import RelatedCodes from './RelatedCodes'

interface ResultsTabsProps {
  code: ICDCode
  conversions: ConversionResult[]
  elixhauser: { categories: ElixhauserCategory[], totalCategories: number } | null
  charlson: CharlsonResult | null
}

export default function ResultsTabs({ code, conversions, elixhauser, charlson }: ResultsTabsProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'conversion' | 'elixhauser' | 'charlson'>('info')
  
  const tabs = [
    { id: 'info' as const, label: 'Information' },
    { id: 'conversion' as const, label: 'Conversion', badge: conversions.length },
    { id: 'elixhauser' as const, label: 'Elixhauser', badge: elixhauser?.totalCategories },
    { id: 'charlson' as const, label: 'Charlson', badge: charlson?.score },
  ]
  
  return (
    <div className="card">
      {/* Tabs */}
      <div className="flex space-x-1 border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-900 text-blue-900'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-900 rounded">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
      
      {/* Content */}
      <div>
        {activeTab === 'info' && <InfoTab code={code} />}
        {activeTab === 'conversion' && <ConversionTab code={code} conversions={conversions} />}
        {activeTab === 'elixhauser' && <ElixhauserTab elixhauser={elixhauser} />}
        {activeTab === 'charlson' && <CharlsonTab charlson={charlson} />}
      </div>
    </div>
  )
}

function InfoTab({ code }: { code: ICDCode }) {
  // Determine code specificity
  const getSpecificityStatus = () => {
    if (code.isFamily) return null
    const codeLength = code.code.replace('.', '').length
    if (codeLength >= 5 && code.system === 'ICD-10-CM') {
      return { type: 'complete', label: 'Complete & Billable' }
    } else if (codeLength < 5) {
      return { type: 'incomplete', label: 'Non-Specific Code' }
    }
    return { type: 'incomplete', label: 'Check Specificity' }
  }
  
  const specificity = getSpecificityStatus()
  
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Code Display */}
      <div>
        <div className="clinical-context">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="text-2xl font-mono font-bold text-gray-900">{code.code}</span>
                <span className="badge-secondary">{code.system}</span>
                {code.isFamily && <span className="badge-warning">CODE FAMILY</span>}
                {specificity && (
                  <span className={`specificity-indicator specificity-${specificity.type}`}>
                    {specificity.label}
                  </span>
                )}
              </div>
              {code.description && (
                <p className="text-gray-700 text-base leading-relaxed">{code.description}</p>
              )}
            </div>
          </div>
          
          {/* Quick Actions */}
          <QuickActions code={code.code} description={code.description || ''} />
        </div>
      </div>
      
      {/* Clinical Alerts */}
      <ClinicalAlerts 
        code={code.code}
        system={code.system}
        isFamily={code.isFamily}
      />
      
      {/* Code Details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <div className="clinical-context-header">Code System</div>
          <div className="font-mono text-lg font-semibold text-gray-900">{code.system}</div>
        </div>
        <div className="card">
          <div className="clinical-context-header">Code Value</div>
          <div className="font-mono text-lg font-semibold text-gray-900">{code.code}</div>
        </div>
        <div className="card">
          <div className="clinical-context-header">Code Type</div>
          <div className="font-mono text-lg font-semibold text-gray-900">
            {code.isFamily ? 'Family' : 'Specific'}
          </div>
        </div>
      </div>
      
      {/* Related Codes */}
      <RelatedCodes primaryCode={code.code} system={code.system} />
    </div>
  )
}

function ConversionTab({ code, conversions }: { code: ICDCode, conversions: ConversionResult[] }) {
  if (conversions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No conversions found for this code.
      </div>
    )
  }
  
  const targetSystem = code.system === 'ICD-10-CM' ? 'ICD-9-CM' : 'ICD-10-CM'
  
  return (
    <div className="space-y-4 animate-fadeIn">
      <h3 className="card-header">Conversion to {targetSystem}</h3>
      <div className="space-y-3">
        {conversions.map((conversion, index) => (
          <div key={index} className="clinical-context">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-mono font-semibold text-gray-900">
                    {conversion.targetCode}
                  </span>
                  {conversion.approximate && (
                    <span className="badge-warning">Approximate</span>
                  )}
                  {conversion.noMap && (
                    <span className="badge-error">No Exact Map</span>
                  )}
                </div>
                {conversion.description && (
                  <p className="text-sm text-gray-600">{conversion.description}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ElixhauserTab({ elixhauser }: { elixhauser: { categories: ElixhauserCategory[], totalCategories: number } | null }) {
  if (!elixhauser || elixhauser.totalCategories === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No Elixhauser comorbidities found for this code.
      </div>
    )
  }
  
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h3 className="card-header mb-0 pb-0 border-0">Elixhauser Comorbidities</h3>
        <span className="badge-primary">
          {elixhauser.totalCategories} categor{elixhauser.totalCategories !== 1 ? 'ies' : 'y'}
        </span>
      </div>
      <div className="grid gap-3 mt-4">
        {elixhauser.categories.map((category, index) => (
          <div key={index} className="clinical-context">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-700" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">{category.name}</h4>
                <p className="text-sm text-gray-600">{category.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CharlsonTab({ charlson }: { charlson: CharlsonResult | null }) {
  if (!charlson) {
    return (
      <div className="text-center py-8 text-gray-500">
        No Charlson score found for this code.
      </div>
    )
  }
  
  return (
    <div className="space-y-4 animate-fadeIn">
      <h3 className="card-header">Charlson Comorbidity Index</h3>
      <div className="clinical-context">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-gray-900">{charlson.condition}</h4>
            <p className="text-sm text-gray-600 mt-1">
              Match type: <span className="font-medium">{charlson.matchType === 'exact' ? 'Exact' : 'Family'}</span>
            </p>
          </div>
          <div className="text-center ml-4">
            <div className="text-4xl font-bold text-purple-900">{charlson.score}</div>
            <div className="text-sm text-gray-600 uppercase tracking-wide">Score</div>
          </div>
        </div>
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-700">
            The Charlson Comorbidity Index is a measure that predicts 10-year mortality. 
            Higher scores indicate greater comorbidity burden and increased mortality risk.
          </p>
        </div>
      </div>
    </div>
  )
}
