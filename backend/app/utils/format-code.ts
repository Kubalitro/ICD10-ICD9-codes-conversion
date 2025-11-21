/**
 * Formats ICD codes with proper dot notation
 * Examples:
 *   H5703 -> H57.03
 *   I2101 -> I21.01
 *   E11 -> E11
 */
export function formatIcdCode(code: string, system?: string): string {
  if (!code) return code

  // Remove any existing dots or spaces
  const cleanCode = code.replace(/[.\s]/g, '').toUpperCase()

  // Check for ICD-9 E-codes (E + 3 digits + optional digits)
  // Standard ICD-9 E-codes are E800-E999
  // Format is EXXX.X (4 characters before dot)
  const isIcd9 = system && (system.toLowerCase().includes('icd-9') || system.toLowerCase().includes('icd9'))

  if (isIcd9 && cleanCode.startsWith('E')) {
    if (cleanCode.length > 4) {
      return cleanCode.slice(0, 4) + '.' + cleanCode.slice(4)
    }
    return cleanCode
  }

  // Default format (ICD-10 and regular ICD-9): 3 characters before dot
  if (cleanCode.length > 3) {
    return cleanCode.slice(0, 3) + '.' + cleanCode.slice(3)
  }

  return cleanCode
}

/**
 * Formats multiple codes separated by comma
 */
export function formatIcdCodes(codes: string): string {
  if (!codes) return codes

  return codes
    .split(',')
    .map(code => formatIcdCode(code.trim()))
    .join(', ')
}
