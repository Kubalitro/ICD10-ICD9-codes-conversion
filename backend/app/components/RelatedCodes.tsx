import { useLanguage } from '../context/LanguageContext'
import { Activity, AlertCircle } from 'lucide-react'

interface RelatedCode {
  code: string
  description: string
  relationship: string
}

interface RelatedCodesProps {
  primaryCode: string
  system: string
  familyData?: any // Added familyData based on instruction, assuming it's optional
}

export default function RelatedCodes({ primaryCode, system, familyData }: RelatedCodesProps) {
  const { t } = useLanguage()

  // Mock data - in production, this would come from the API
  const getRelatedCodes = (): { frequently: RelatedCode[], complications: RelatedCode[], excludes: RelatedCode[] } => {
    // Example: Diabetes codes
    if (primaryCode.startsWith('E10') || primaryCode.startsWith('E11')) {
      return {
        frequently: [
          { code: 'E87.2', description: 'Acidosis', relationship: 'commonly_with' },
          { code: 'R73.9', description: 'Hyperglycemia', relationship: 'commonly_with' },
          { code: 'Z79.4', description: 'Long-term insulin use', relationship: 'commonly_with' },
        ],
        complications: [
          { code: 'E10.21/E11.21', description: 'Diabetic nephropathy', relationship: 'complication' },
          { code: 'E10.311/E11.311', description: 'Diabetic retinopathy', relationship: 'complication' },
          { code: 'E10.40/E11.40', description: 'Diabetic neuropathy', relationship: 'complication' },
        ],
        excludes: primaryCode.startsWith('E10')
          ? [{ code: 'E11.x', description: 'Type 2 diabetes mellitus', relationship: 'excludes' }]
          : [{ code: 'E10.x', description: 'Type 1 diabetes mellitus', relationship: 'excludes' }]
      }
    }

    // Example: Hypertension
    if (primaryCode.startsWith('I10') || primaryCode.startsWith('I11')) {
      return {
        frequently: [
          { code: 'I25.10', description: 'CAD without angina', relationship: 'commonly_with' },
          { code: 'N18.3', description: 'CKD Stage 3', relationship: 'commonly_with' },
        ],
        complications: [
          { code: 'I50.9', description: 'Heart failure', relationship: 'complication' },
          { code: 'I63.9', description: 'Cerebral infarction', relationship: 'complication' },
        ],
        excludes: []
      }
    }

    return { frequently: [], complications: [], excludes: [] }
  }

  const related = getRelatedCodes()
  const hasRelatedCodes = related.frequently.length > 0 || related.complications.length > 0 || related.excludes.length > 0

  if (!hasRelatedCodes) {
    return null
  }

  return (
    <div className="clinical-context">
      <div className="clinical-context-header">Related Clinical Codes</div>

      <div className="space-y-4">
        {/* Frequently Coded Together */}
        {related.frequently.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4" />
              {t('frequentlyCodedTogether')}
            </h4>
            <div className="space-y-2">
              {related.frequently.map((item, index) => (
                <div key={index} className="code-tree-item">
                  <span className="text-gray-400">├─</span>
                  <span className="font-mono font-semibold text-gray-900">{item.code}</span>
                  <span className="text-gray-600">{item.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Typical Complications */}
        {related.complications.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {t('typicalComplications')}
            </h4>
            <div className="space-y-2">
              {related.complications.map((item, index) => (
                <div key={index} className="code-tree-item">
                  <span className="text-gray-400">├─</span>
                  <span className="font-mono font-semibold text-gray-900">{item.code}</span>
                  <span className="text-gray-600">{item.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Excludes */}
        {related.excludes.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-3 uppercase tracking-wider">
              {t('excludesDoNotCodeTogether')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {related.excludes.map((item, index) => (
                <div key={index} className="code-tree-item bg-red-50">
                  <span className="text-red-400">✗</span>
                  <span className="font-mono font-semibold text-red-900">{item.code}</span>
                  <span className="text-red-700">{item.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
