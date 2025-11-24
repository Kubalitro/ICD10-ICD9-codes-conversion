import { sql } from '../lib/db';

const NEW_CATEGORIES = [
    { code: 'ARRHYTHMIA', name: 'Cardiac arrhythmias', description: 'Cardiac arrhythmias' },
    { code: 'FLUID_ELECTRO', name: 'Fluid and electrolyte disorders', description: 'Fluid and electrolyte disorders' }
];

const MAPPINGS: Record<string, string[]> = {
    'ARRHYTHMIA': ['I44.1-I44.3', 'I45.6', 'I45.9', 'I47.x-I49.x', 'R00.0', 'R00.1', 'R00.8', 'T82.1', 'Z45.0', 'Z95.0'],
    'FLUID_ELECTRO': ['E22.2', 'E86.x', 'E87.x'],
    'VALVE': ['A52.0', 'I05.x-I08.x', 'I09.1', 'I09.8', 'I34.x-I39.x', 'Q23.0-Q23.3', 'Z95.2', 'Z95.4'],
    'PULMCIRC': ['I26.x', 'I27.x', 'I28.0', 'I28.8', 'I28.9'],
    'PERIVASC': ['I70.x', 'I71.x', 'I73.1', 'I73.8', 'I73.9', 'I77.1', 'I79.0', 'I79.2', 'K55.1', 'K55.8', 'K55.9', 'Z95.8', 'Z95.9'],
    'HTN_UNCX': ['I10.x'],
    'HTN_CX': ['I11.x-I13.x', 'I15.x'],
    'PARALYSIS': ['G04.1', 'G11.4', 'G80.1', 'G80.2', 'G81.x', 'G82.x', 'G83.0-G83.4', 'G83.9'],
    'NEURO_OTH': ['G10.x-G13.x', 'G20.x-G22.x', 'G25.4', 'G25.5', 'G31.2', 'G31.8', 'G31.9', 'G32.x', 'G35.x-G37.x', 'G40.x', 'G41.x', 'G93.1', 'G93.4', 'R47.0', 'R56.x'],
    'LUNG_CHRONIC': ['I27.8', 'I27.9', 'J40.x-J47.x', 'J60.x-J67.x', 'J68.4', 'J70.1', 'J70.3'],
    'DIAB_UNCX': ['E10.0', 'E10.1', 'E10.9', 'E11.0', 'E11.1', 'E11.9', 'E12.0', 'E12.1', 'E12.9', 'E13.0', 'E13.1', 'E13.9', 'E14.0', 'E14.1', 'E14.9'],
    'DIAB_CX': ['E10.2-E10.8', 'E11.2-E11.8', 'E12.2-E12.8', 'E13.2-E13.8', 'E14.2-E14.8'],
    'THYROID_HYPO': ['E00.x-E03.x', 'E89.0'],
    'RENLFL_MOD': ['I12.0', 'I13.1', 'N18.x', 'N19.x', 'N25.0', 'Z49.0-Z49.2', 'Z94.0', 'Z99.2'],
    'LIVER_MLD': ['B18.x', 'I85.x', 'I86.4', 'I98.2', 'K70.x', 'K71.1', 'K71.3-K71.5', 'K71.7', 'K72.x-K74.x', 'K76.0', 'K76.2-K76.9', 'Z94.4'],
    'ULCER_PEPTIC': ['K25.7', 'K25.9', 'K26.7', 'K26.9', 'K27.7', 'K27.9', 'K28.7', 'K28.9'],
    'AIDS': ['B20.x-B22.x', 'B24.x'],
    'CANCER_LYMPH': ['C81.x-C85.x', 'C88.x', 'C96.x', 'C90.0', 'C90.2'],
    'CANCER_METS': ['C77.x-C80.x'],
    'CANCER_SOLID': ['C00.x-C26.x', 'C30.x-C34.x', 'C37.x-C41.x', 'C43.x', 'C45.x-C58.x', 'C60.x-C76.x', 'C97.x'],
    'AUTOIMMUNE': ['L94.0', 'L94.1', 'L94.3', 'M05.x', 'M06.x', 'M08.x', 'M12.0', 'M12.3', 'M30.x', 'M31.0-M31.3', 'M32.x-M35.x', 'M45.x', 'M46.1', 'M46.8', 'M46.9'],
    'COAG': ['D65-D68.x', 'D69.1', 'D69.3-D69.6'],
    'OBESE': ['E66.x'],
    'WGHTLOSS': ['E40.x-E46.x', 'R63.4', 'R64'],
    'BLDLOSS': ['D50.0'],
    'ANEMDEF': ['D50.8', 'D50.9', 'D51.x-D53.x'],
    'ALCOHOL': ['F10', 'E52', 'G62.1', 'I42.6', 'K29.2', 'K70.0', 'K70.3', 'K70.9', 'T51.x', 'Z50.2', 'Z71.4', 'Z72.1'],
    'DRUG_ABUSE': ['F11.x-F16.x', 'F18.x', 'F19.x', 'Z71.5', 'Z72.2'],
    'PSYCHOSES': ['F20.x', 'F22.x-F25.x', 'F28.x', 'F29.x', 'F30.2', 'F31.2', 'F31.5'],
    'DEPRESS': ['F20.4', 'F31.3-F31.5', 'F32.x', 'F33.x', 'F34.1', 'F41.2', 'F43.2']
};

async function expandPattern(pattern: string): Promise<string[]> {
    const cleanPattern = pattern.replace(/\./g, '');

    if (pattern.includes('-')) {
        const [start, end] = pattern.split('-');
        const cleanStart = start.replace(/\.x|x$/, '').replace(/\./g, '');
        const cleanEnd = end.replace(/\.x|x$/, '').replace(/\./g, '');

        // Query for range
        const codes = await sql`
      SELECT code FROM icd10_codes 
      WHERE code >= ${cleanStart} AND code <= ${cleanEnd + '9999'}
    `;
        return codes.map((c: any) => c.code);
    }

    if (pattern.endsWith('.x') || pattern.endsWith('x')) {
        const prefix = pattern.replace(/\.x|x$/, '').replace(/\./g, '');
        const codes = await sql`
      SELECT code FROM icd10_codes 
      WHERE code LIKE ${prefix + '%'}
    `;
        return codes.map((c: any) => c.code);
    }

    // Exact code
    const codes = await sql`
    SELECT code FROM icd10_codes 
    WHERE code = ${cleanPattern}
  `;
    return codes.map((c: any) => c.code);
}

async function update() {
    console.log('Starting Elixhauser update...');

    // 1. Add new categories
    for (const cat of NEW_CATEGORIES) {
        console.log(`Adding category: ${cat.code}`);
        await sql`
      INSERT INTO elixhauser_categories (code, name, description)
      VALUES (${cat.code}, ${cat.name}, ${cat.description})
      ON CONFLICT (code) DO NOTHING
    `;
    }

    // 2. Process mappings
    for (const [category, patterns] of Object.entries(MAPPINGS)) {
        console.log(`Processing ${category}...`);
        let count = 0;

        // Fetch existing codes for this category to avoid duplicates
        const existing = await sql`
      SELECT icd10_code FROM elixhauser_mappings WHERE category_code = ${category}
    `;
        const existingSet = new Set(existing.map((r: any) => r.icd10_code));

        for (const pattern of patterns) {
            const codes = await expandPattern(pattern);

            if (codes.length > 0) {
                let insertedForPattern = 0;
                for (const code of codes) {
                    if (!existingSet.has(code)) {
                        await sql`
                    INSERT INTO elixhauser_mappings (icd10_code, category_code)
                    VALUES (${code}, ${category})
                `;
                        existingSet.add(code);
                        insertedForPattern++;
                    }
                }
                count += insertedForPattern;
            }
        }
        console.log(`  Added ${count} new codes for ${category}`);
    }

    console.log('Update complete!');
}

update().catch(console.error);
