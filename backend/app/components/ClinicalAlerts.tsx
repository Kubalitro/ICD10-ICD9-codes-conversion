import { useLanguage } from '../context/LanguageContext'

interface ClinicalAlert {
  type: 'critical' | 'warning' | 'info' | 'success'
  title: string
  message: string
}

interface ClinicalAlertsProps {
  code: string
  system: string
  isFamily?: boolean
}

export default function ClinicalAlerts({ code, system, isFamily }: ClinicalAlertsProps) {
  const { t } = useLanguage()
  // Mock alerts - in production, these would come from the API
  const alerts: ClinicalAlert[] = []

  // Check if code is billable (simplified logic)
  const isBillable = !isFamily

  if (!isBillable && !isFamily) {
    alerts.push({
      type: 'warning',
      title: t('nonSpecificCode'),
      message: t('nonSpecificCodeMsg')
    })
  }

  if (isFamily) {
    alerts.push({
      type: 'info',
      title: t('codeFamilySearch'),
      message: t('codeFamilySearchMsg')
    })
  }

  // Example: Check for diabetes codes requiring documentation
  if (code.startsWith('E10') || code.startsWith('E11')) {
    alerts.push({
      type: 'info',
      title: t('documentationRequired'),
      message: t('documentationRequiredMsg')
    })
  }

  // Example: Billable code confirmation
  if (isBillable && system === 'ICD-10-CM') {
    alerts.push({
      type: 'success',
      title: t('billableCode'),
      message: t('billableCodeMsg')
    })
  }

  if (alerts.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert, index) => (
        <div key={index} className={`clinical-alert clinical-alert-${alert.type}`}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {alert.type === 'critical' && (
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              {alert.type === 'warning' && (
                <svg className="w-5 h-5 text-yellow-700" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              {alert.type === 'info' && (
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              )}
              {alert.type === 'success' && (
                <svg className="w-5 h-5 text-green-700" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold mb-1" style={{
                color: alert.type === 'critical' ? '#991b1b' :
                  alert.type === 'warning' ? '#92400e' :
                    alert.type === 'info' ? '#1e40af' : '#065f46'
              }}>
                {alert.title}
              </h4>
              <p className="text-sm" style={{
                color: alert.type === 'critical' ? '#7f1d1d' :
                  alert.type === 'warning' ? '#78350f' :
                    alert.type === 'info' ? '#1e3a8a' : '#064e3b'
              }}>
                {alert.message}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
