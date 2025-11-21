/**
 * Medical Synonyms Dictionary
 * Maps common medical abbreviations and alternative terms to their full descriptions
 */

export const MEDICAL_SYNONYMS: Record<string, string[]> = {
  // Cardiovascular
  'mi': ['myocardial infarction', 'heart attack'],
  'ami': ['acute myocardial infarction', 'acute heart attack'],
  'cad': ['coronary artery disease', 'coronary heart disease'],
  'chf': ['congestive heart failure', 'heart failure'],
  'htn': ['hypertension', 'high blood pressure'],
  'afib': ['atrial fibrillation'],
  'a fib': ['atrial fibrillation'],
  'cabg': ['coronary artery bypass graft', 'bypass surgery'],
  'pci': ['percutaneous coronary intervention', 'angioplasty'],
  'dvt': ['deep vein thrombosis', 'deep venous thrombosis'],
  'pe': ['pulmonary embolism'],
  'vte': ['venous thromboembolism'],

  // Respiratory
  'copd': ['chronic obstructive pulmonary disease'],
  'asthma': ['reactive airway disease'],
  'pneumonia': ['lung infection', 'pulmonary infection'],
  'ards': ['acute respiratory distress syndrome'],
  'sob': ['shortness of breath', 'dyspnea'],

  // Endocrine/Metabolic
  'dm': ['diabetes mellitus', 'diabetes'],
  'diabetes': ['diabetes mellitus'],
  't1dm': ['type 1 diabetes mellitus', 'type 1 diabetes'],
  't2dm': ['type 2 diabetes mellitus', 'type 2 diabetes'],
  'dka': ['diabetic ketoacidosis', 'ketoacidosis'],
  'hypoglycemia': ['low blood sugar'],
  'hyperglycemia': ['high blood sugar', 'elevated blood glucose'],
  'thyroid': ['thyroid disorder'],
  'hypothyroid': ['hypothyroidism', 'underactive thyroid'],
  'hyperthyroid': ['hyperthyroidism', 'overactive thyroid'],

  // Renal
  'ckd': ['chronic kidney disease', 'chronic renal disease'],
  'esrd': ['end stage renal disease', 'end stage kidney disease'],
  'aki': ['acute kidney injury', 'acute renal failure'],
  'arf': ['acute renal failure', 'acute kidney injury'],
  'dialysis': ['hemodialysis', 'renal dialysis'],

  // Gastrointestinal
  'gerd': ['gastroesophageal reflux disease', 'acid reflux'],
  'ibd': ['inflammatory bowel disease'],
  'ibs': ['irritable bowel syndrome'],
  'gi bleed': ['gastrointestinal bleeding', 'gastrointestinal hemorrhage'],
  'cirrhosis': ['liver cirrhosis', 'hepatic cirrhosis'],

  // Neurological
  'cva': ['cerebrovascular accident', 'stroke'],
  'stroke': ['cerebrovascular accident', 'cerebral infarction'],
  'tia': ['transient ischemic attack', 'mini stroke'],
  'seizure': ['convulsion', 'epileptic seizure'],
  'epilepsy': ['seizure disorder'],
  'ms': ['multiple sclerosis'],
  'als': ['amyotrophic lateral sclerosis'],
  'parkinsons': ['parkinson disease', 'parkinson disease'],

  // Psychiatric
  'depression': ['major depressive disorder', 'depressive disorder'],
  'mdd': ['major depressive disorder'],
  'anxiety': ['anxiety disorder', 'generalized anxiety'],
  'gad': ['generalized anxiety disorder'],
  'ptsd': ['post traumatic stress disorder', 'posttraumatic stress'],
  'ocd': ['obsessive compulsive disorder'],
  'adhd': ['attention deficit hyperactivity disorder'],
  'add': ['attention deficit disorder'],

  // Infectious
  'uti': ['urinary tract infection', 'bladder infection'],
  'sepsis': ['septicemia', 'blood infection'],
  'hiv': ['human immunodeficiency virus'],
  'aids': ['acquired immunodeficiency syndrome'],
  'covid': ['coronavirus', 'sars-cov-2', 'covid-19'],
  'flu': ['influenza'],

  // Musculoskeletal
  'oa': ['osteoarthritis', 'degenerative joint disease'],
  'ra': ['rheumatoid arthritis'],
  'fracture': ['broken bone', 'bone fracture'],
  'fx': ['fracture', 'broken bone'],
  'osteoporosis': ['bone loss', 'decreased bone density'],

  // Cancer/Oncology
  'ca': ['cancer', 'carcinoma'],
  'mets': ['metastases', 'metastatic disease'],
  'chemo': ['chemotherapy'],
  'radiation': ['radiation therapy', 'radiotherapy'],

  // Cardiovascular (Extended)
  'pad': ['peripheral artery disease', 'peripheral arterial disease'],
  'pvd': ['peripheral vascular disease'],
  'angina': ['chest pain', 'cardiac chest pain'],
  'valve disease': ['valvular disease', 'valvular heart disease'],
  'cardiomyopathy': ['heart muscle disease'],

  // Gastrointestinal (Extended)
  'pancreatitis': ['pancreas inflammation', 'inflamed pancreas'],
  'hepatitis': ['liver inflammation'],
  'colitis': ['colon inflammation', 'inflammatory bowel'],
  'diverticulitis': ['diverticular disease'],
  'gastritis': ['stomach inflammation'],

  // Neurological (Extended)
  'dementia': ['cognitive decline', 'memory loss'],
  'alzheimers': ['alzheimer disease', 'alzheimer dementia'],
  'neuropathy': ['nerve damage', 'peripheral neuropathy'],
  'migraine': ['severe headache', 'headache disorder'],
  'vertigo': ['dizziness', 'balance disorder'],

  // Hematology/Lab
  'anemia': ['low hemoglobin', 'low blood count'],
  'thrombocytopenia': ['low platelets', 'low platelet count'],
  'leukopenia': ['low white blood cells', 'low wbc'],
  'neutropenia': ['low neutrophils'],
  'coagulopathy': ['bleeding disorder', 'clotting disorder'],

  // Endocrine (Extended)
  'cushings': ['cushing syndrome', 'hypercortisolism'],
  'addisons': ['addison disease', 'adrenal insufficiency'],
  'acromegaly': ['growth hormone excess'],

  // Other Common Terms
  'hx': ['history of'],
  'r/o': ['rule out'],
  'w/': ['with'],
  'w/o': ['without'],
  's/p': ['status post', 'after'],
  'acute': ['sudden onset'],
  'chronic': ['long term', 'persistent'],
}

/**
 * Expands a query by replacing abbreviations with their synonyms
 * @param query - The search query
 * @returns Array of expanded queries including the original
 */
export function expandQueryWithSynonyms(query: string): string[] {
  const lowerQuery = query.toLowerCase().trim()
  const expandedQueries = new Set<string>([lowerQuery])

  // Check each synonym entry
  for (const [abbrev, synonyms] of Object.entries(MEDICAL_SYNONYMS)) {
    // Check if the abbreviation appears as a word in the query
    const regex = new RegExp(`\\b${abbrev}\\b`, 'gi')

    if (regex.test(lowerQuery)) {
      // Add queries with each synonym replacement
      synonyms.forEach(synonym => {
        const expandedQuery = lowerQuery.replace(regex, synonym)
        expandedQueries.add(expandedQuery)
      })
    }
  }

  return Array.from(expandedQueries)
}

/**
 * Suggests corrections for common abbreviations
 * @param query - The search query
 * @returns Suggested full terms if abbreviation found
 */
export function getSynonymSuggestions(query: string): string[] {
  const lowerQuery = query.toLowerCase().trim()
  const suggestions: string[] = []

  for (const [abbrev, synonyms] of Object.entries(MEDICAL_SYNONYMS)) {
    if (lowerQuery === abbrev || lowerQuery.includes(` ${abbrev} `) ||
      lowerQuery.startsWith(`${abbrev} `) || lowerQuery.endsWith(` ${abbrev}`)) {
      suggestions.push(...synonyms)
    }
  }

  return suggestions
}
