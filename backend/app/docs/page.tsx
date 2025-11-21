'use client'

import { useLanguage } from '../context/LanguageContext'

export default function DocsPage() {
  const { t } = useLanguage()
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">{t('docsTitle')}</h1>

      <div className="space-y-8">
        {/* Introducción */}
        <section className="card">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('introTitle')}</h2>
          <p className="text-gray-700 mb-4">
            {t('introText1')}
          </p>
          <p className="text-gray-700">
            {t('introText2')}
          </p>
        </section>

        {/* Sistemas ICD */}
        <section className="card">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('icdSystemsTitle')}</h2>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">{t('icd10Title')}</h3>
          <p className="text-gray-700 mb-4">
            {t('icd10Desc')}
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>{t('icd10List1')}</li>
            <li>{t('icd10List2')}</li>
            <li>{t('icd10List3')}</li>
            <li>{t('icd10List4')}</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">{t('icd9Title')}</h3>
          <p className="text-gray-700 mb-4">
            {t('icd9Desc')}
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>{t('icd9List1')}</li>
            <li>{t('icd9List2')}</li>
            <li>{t('icd9List3')}</li>
            <li>{t('icd9List4')}</li>
          </ul>
        </section>

        {/* Conversión */}
        <section className="card">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('conversionTitle')}</h2>
          <p className="text-gray-700 mb-4">
            {t('conversionDesc')}
          </p>

          <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4">{t('mappingTypesTitle')}</h3>
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-1">{t('mappingExact')}</h4>
              <p className="text-sm text-gray-700">
                {t('mappingExactDesc')}
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 mb-1">{t('mappingOneToMany')}</h4>
              <p className="text-sm text-gray-700">
                {t('mappingOneToManyDesc')}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-1">{t('mappingManyToOne')}</h4>
              <p className="text-sm text-gray-700">
                {t('mappingManyToOneDesc')}
              </p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 mb-1">{t('mappingApprox')}</h4>
              <p className="text-sm text-gray-700">
                {t('mappingApproxDesc')}
              </p>
            </div>
          </div>
        </section>

        {/* Elixhauser */}
        <section className="card">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('elixhauserTitle')}</h2>
          <p className="text-gray-700 mb-4">
            {t('elixhauserDesc')}
          </p>
          <p className="text-gray-700 mb-4">
            <strong>{t('elixhauserSource')}</strong> Healthcare Cost and Utilization Project (HCUP-US-AHRQ.gov)
          </p>
          <p className="text-gray-700">
            {t('elixhauserList')}
          </p>
        </section>

        {/* Charlson */}
        <section className="card">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('charlsonTitle')}</h2>
          <p className="text-gray-700 mb-4">
            {t('charlsonDesc')}
          </p>
          <p className="text-gray-700 mb-4">
            <strong>{t('charlsonSource')}</strong> PMC-NCBI.NLM.NIH.gov (Canadian Data-Derived Modified Charlson Comorbidity Index)
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 mt-4">{t('scoreInterpretation')}</h3>
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li>• <strong>{t('score0')}</strong> {t('score0Desc')}</li>
              <li>• <strong>{t('score1_2')}</strong> {t('score1_2Desc')}</li>
              <li>• <strong>{t('score3_4')}</strong> {t('score3_4Desc')}</li>
              <li>• <strong>{t('score5plus')}</strong> {t('score5plusDesc')}</li>
            </ul>
          </div>
        </section>

        {/* User Features */}
        <section className="card">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('userFeaturesTitle')}</h2>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">{t('accountManagementTitle')}</h3>
          <p className="text-gray-700 mb-4">
            {t('accountManagementDesc')}
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">{t('personalizationTitle')}</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li><strong>{t('searchHistory')}</strong>: {t('historyDesc')}</li>
            <li><strong>{t('favoriteCodes')}</strong>: {t('favoritesDesc')}</li>
            <li><strong>{t('profile')}</strong>: {t('dashboardDesc')}</li>
          </ul>
        </section>

        {/* Batch Operations */}
        <section className="card">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('batchDocsTitle')}</h2>
          <p className="text-gray-700 mb-4">
            {t('batchDocsIntro')}
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">{t('textInputMode')}</h3>
          <p className="text-gray-700 mb-4">
            {t('textInputDesc')}
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">{t('fileUploadMode')}</h3>
          <p className="text-gray-700 mb-4">
            {t('fileUploadDesc')}
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">{t('exportOptions')}</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>{t('exportDesc')}</li>
            <li>{t('batchHistoryDesc')}</li>
          </ul>
        </section>

        {/* API */}
        <section className="card">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('apiEndpointsTitle')}</h2>
          <p className="text-gray-700 mb-4">
            {t('apiDesc')}
          </p>
          <div className="space-y-3 text-sm">
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-3 font-mono">
              <div className="text-blue-600 dark:text-blue-400 font-semibold mb-1">GET /api/search?code=E10.10</div>
              <div className="text-gray-600 dark:text-gray-400">{t('searchCode')}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-3 font-mono">
              <div className="text-blue-600 dark:text-blue-400 font-semibold mb-1">GET /api/convert?code=E1010&from=icd10&to=icd9</div>
              <div className="text-gray-600 dark:text-gray-400">{t('convertCode')}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-3 font-mono">
              <div className="text-blue-600 dark:text-blue-400 font-semibold mb-1">GET /api/elixhauser?code=E1010</div>
              <div className="text-gray-600 dark:text-gray-400">{t('getElixhauser')}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-3 font-mono">
              <div className="text-blue-600 dark:text-blue-400 font-semibold mb-1">GET /api/charlson?code=E10&system=icd10</div>
              <div className="text-gray-600 dark:text-gray-400">{t('calcCharlson')}</div>
            </div>

            {/* New Endpoints */}
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-3 font-mono">
              <div className="text-blue-600 dark:text-blue-400 font-semibold mb-1">GET /api/history</div>
              <div className="text-gray-600 dark:text-gray-400">{t('apiHistory')}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-3 font-mono">
              <div className="text-blue-600 dark:text-blue-400 font-semibold mb-1">GET /api/favorites</div>
              <div className="text-gray-600 dark:text-gray-400">{t('apiFavorites')}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-3 font-mono">
              <div className="text-blue-600 dark:text-blue-400 font-semibold mb-1">POST /api/batch/upload</div>
              <div className="text-gray-600 dark:text-gray-400">{t('apiBatchUpload')}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-3 font-mono">
              <div className="text-blue-600 dark:text-blue-400 font-semibold mb-1">GET /api/batch/jobs</div>
              <div className="text-gray-600 dark:text-gray-400">{t('apiBatchJobs')}</div>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="card bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-800">
          <h2 className="text-2xl font-semibold text-yellow-900 dark:text-yellow-200 mb-4">{t('importantDisclaimer')}</h2>
          <div className="text-yellow-900 dark:text-yellow-100 space-y-3">
            <p>
              <strong>{t('disclaimerFull1')}</strong>
            </p>
            <p>
              {t('disclaimerFull2')}
            </p>
            <p>
              <strong>{t('disclaimerFull3')}</strong>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
