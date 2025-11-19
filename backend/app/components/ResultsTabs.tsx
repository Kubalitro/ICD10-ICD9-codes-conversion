'use client'

import { useState } from 'react'
import { ICDCode, ConversionResult, ElixhauserCategory, CharlsonResult } from '../types'
import ClinicalAlerts from './ClinicalAlerts'
import QuickActions from './QuickActions'
import RelatedCodes from './RelatedCodes'
import FavoriteButton from './FavoriteButton'
import { formatIcdCode } from '../utils/format-code'
import { useLanguage } from '../context/LanguageContext'

interface ResultsTabsProps {
  code: ICDCode
  conversions: ConversionResult[]
  elixhauser: { categories: ElixhauserCategory[], totalCategories: number } | null
  charlson: CharlsonResult | null
  familyData?: any
}

export default function ResultsTabs({ code, conversions, elixhauser, charlson, familyData }: ResultsTabsProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'conversion' | 'elixhauser' | 'charlson'>('info')
  const { t } = useLanguage()

  const tabs = [
    { id: 'info' as const, label: t('tabInformation') },
    { id: 'conversion' as const, label: t('tabConversion'), badge: conversions.length },
    { id: 'elixhauser' as const, label: t('tabElixhauser'), badge: elixhauser?.totalCategories },
    { id: 'charlson' as const, label: t('tabCharlson'), badge: charlson?.score },
  ]

  return (
    <div className="card">
      {/* Tabs */}
      <div className="flex space-x-1 border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id
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
        {activeTab === 'info' && <InfoTab code={code} conversions={conversions} elixhauser={elixhauser} charlson={charlson} />}
        {activeTab === 'conversion' && <ConversionTab code={code} conversions={conversions} familyData={familyData} />}
        {activeTab === 'elixhauser' && <ElixhauserTab elixhauser={elixhauser} />}
        {activeTab === 'charlson' && <CharlsonTab charlson={charlson} />}
      </div>
    </div>
  )
}

function InfoTab({ code, conversions, elixhauser, charlson }: {
  code: ICDCode
  conversions: ConversionResult[]
  elixhauser: { categories: ElixhauserCategory[], totalCategories: number } | null
  charlson: CharlsonResult | null
}) {
  const { t } = useLanguage()

  // Determine code specificity
  const getSpecificityStatus = () => {
    if (code.isFamily) return null
    const codeLength = code.code.replace('.', '').length
    if (codeLength >= 5 && code.system === 'ICD-10-CM') {
      return { type: 'complete', label: t('completeBillable') }
    } else if (codeLength < 5) {
      return { type: 'incomplete', label: t('nonSpecificCode') }
    }
    return { type: 'incomplete', label: t('checkSpecificity') }
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
                <span className="text-2xl font-mono font-bold text-gray-900">{formatIcdCode(code.code)}</span>
                <span className="badge-secondary">{code.system}</span>
                {code.isFamily && <span className="badge-warning">{t('codeFamily')}</span>}
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

          {/* Quick Actions + Favorite Button */}
          <div className="flex items-center gap-3 flex-wrap">
            <QuickActions
              code={code.code}
              description={code.description || ''}
              system={code.system}
              conversions={conversions}
              elixhauser={elixhauser}
              charlson={charlson}
            />
            <FavoriteButton
              code={code.code}
              system={code.system}
              description={code.description || ''}
            />
          </div>
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
          <div className="clinical-context-header">{t('codeSystem')}</div>
          <div className="font-mono text-lg font-semibold text-gray-900">{code.system}</div>
        </div>
        <div className="card">
          <div className="clinical-context-header">{t('codeValue')}</div>
          <div className="font-mono text-lg font-semibold text-gray-900">{formatIcdCode(code.code)}</div>
        </div>
        <div className="card">
          <div className="clinical-context-header">{t('codeType')}</div>
          <div className="font-mono text-lg font-semibold text-gray-900">
            {code.isFamily ? t('family') : t('specific')}
          </div>
        </div>
      </div>

      {/* Related Codes */}
      <RelatedCodes primaryCode={code.code} system={code.system} />
    </div>
  )
}

function ConversionTab({ code, conversions, familyData }: { code: ICDCode, conversions: ConversionResult[], familyData?: any }) {
  const { t } = useLanguage()

  if (conversions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t('noConversionsFound')}
      </div>
    )
  }

  const targetSystem = code.system === 'ICD-10-CM' ? 'ICD-9-CM' : 'ICD-10-CM'

  // Show family conversion summary if available
  if (familyData) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <h3 className="card-header">{t('conversionTo')} {targetSystem}</h3>

        {/* Family Summary */}
        <div className="clinical-context bg-blue-50 dark:bg-blue-900/10">
          <h4 className="font-semibold text-blue-900 dark:text-blue-400 mb-2">{t('familyConversionSummary')}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('sourceFamilyCodes')}</div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-400">{familyData.sourceFamilyCount}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('targetFamilies')}</div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-400">{familyData.targetFamiliesCount}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('totalConversions')}</div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-400">{conversions.length}</div>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('targetCodeFamilies')}</div>
            <div className="flex flex-wrap gap-2">
              {familyData.targetFamilies.map((family: string, idx: number) => (
                <span key={idx} className="badge-primary font-mono">{family}</span>
              ))}
            </div>
          </div>
        </div>

        {/* All Conversions */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('allConversions')} ({conversions.length})</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {conversions.map((conversion, index) => (
              <div key={index} className="clinical-context py-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-gray-600 dark:text-gray-400">{formatIcdCode(conversion.sourceCode || '')}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">{formatIcdCode(conversion.targetCode)}</span>
                    </div>
                    {conversion.sourceDescription && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{conversion.sourceDescription}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Regular conversion display
  return (
    <div className="space-y-4 animate-fadeIn">
      <h3 className="card-header">{t('conversionTo')} {targetSystem}</h3>
      <div className="space-y-3">
        {conversions.map((conversion, index) => (
          <div key={index} className="clinical-context">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-mono font-semibold text-gray-900 dark:text-gray-100">
                    {formatIcdCode(conversion.targetCode)}
                  </span>
                  {conversion.approximate && (
                    <span className="badge-warning">{t('approximate')}</span>
                  )}
                  {conversion.noMap && (
                    <span className="badge-error">{t('noExactMap')}</span>
                  )}
                </div>
                {conversion.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{conversion.description}</p>
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
  const { t } = useLanguage()

  if (!elixhauser || elixhauser.totalCategories === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t('noElixhauserFound')}
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h3 className="card-header mb-0 pb-0 border-0">{t('elixhauserComorbidities')}</h3>
        <span className="badge-primary">
          {elixhauser.totalCategories} {elixhauser.totalCategories !== 1 ? t('categories') : t('category')}
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
  const { t } = useLanguage()

  if (!charlson) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t('noCharlsonFound')}
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <h3 className="card-header">{t('charlsonIndex')}</h3>
      <div className="clinical-context">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-gray-900">{charlson.condition}</h4>
            <p className="text-sm text-gray-600 mt-1">
              {t('matchType')}: <span className="font-medium">{charlson.matchType === 'exact' ? t('exact') : t('family')}</span>
            </p>
          </div>
          <div className="text-center ml-4">
            <div className="text-4xl font-bold text-purple-900">{charlson.score}</div>
            <div className="text-sm text-gray-600 uppercase tracking-wide">{t('score')}</div>
          </div>
        </div>
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-700">
            {t('charlsonDescription')}
          </p>
        </div>
      </div>
    </div>
  )
}
