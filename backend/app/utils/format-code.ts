/**
 * Formats ICD codes with proper dot notation
 * Examples:
 *   H5703 -> H57.03
 *   I2101 -> I21.01
 *   E11 -> E11
 */
export function formatIcdCode(code: string): string {
  if (!code) return code
  
  // Remove any existing dots or spaces
  const cleanCode = code.replace(/[.\s]/g, '').toUpperCase()
  
  // ICD-10 format: Letter(s) + digits
  // Add dot after 3rd character if code is longer than 3 characters
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
