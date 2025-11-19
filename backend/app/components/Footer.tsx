'use client'

import { useLanguage } from '../context/LanguageContext'

export default function Footer() {
  const { t } = useLanguage()
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">{t('aboutApp')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('aboutAppDesc')}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">{t('dataSources')}</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>📊 CMS.gov - General Equivalence Mappings</li>
              <li>📊 NBER.org - ICD Crosswalks</li>
              <li>📊 HCUP-US-AHRQ.gov - Elixhauser</li>
              <li>📊 PMC-NCBI.NLM.NIH.gov - Charlson Index</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">{t('disclaimer')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('disclaimerText')}
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>{t('copyright')}</p>
        </div>
      </div>
    </footer>
  )
}
