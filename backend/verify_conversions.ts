
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { sql } from './lib/db';

const BASE_URL = 'http://localhost:3000';

const TEST_CODES = [
    'E10.10', // Type 1 DM with ketoacidosis
    'I10',    // Essential hypertension
    'J44.9',  // COPD, unspecified
    'F41.1',  // Generalized anxiety disorder
    'M54.5',  // Low back pain (Note: might be invalid/deleted in newer versions, good test)
    'M54.50', // Low back pain, unspecified
    'R05',    // Cough (Category)
    'R05.9',  // Cough, unspecified
    'S82.801A', // Fracture of other parts of right lower leg, initial
    'Z00.00', // Encntr for general adult medical exam w/o abnormal findings
    'A00.0',  // Cholera due to Vibrio cholerae 01, biovar cholerae
    'C50.911', // Malignant neoplasm of unsp site of right female breast
    'O80',    // Encounter for full-term uncomplicated delivery
    'E11.9',  // Type 2 DM without complications
    'B34.9',  // Viral infection, unspecified
    'K21.9',  // GERD without esophagitis
    'N39.0',  // UTI, site not specified
    'R10.9',  // Unspecified abdominal pain
    'H10.9',  // Unspecified conjunctivitis
    'J02.9',  // Acute pharyngitis, unspecified
    'L03.90', // Cellulitis, unspecified part of body
    'M25.50', // Pain in unspecified joint
    'R51.9',  // Headache, unspecified
    'U07.1',  // COVID-19
];

async function verifyCode(code: string) {
    console.log(`\nChecking code: ${code}`);
    const cleanCode = code.replace(/\./g, '');

    // 1. Check API
    let apiConversions = 0;
    let apiError = null;
    try {
        const res = await fetch(`${BASE_URL}/api/convert?code=${code}&from=icd10&to=icd9`);
        if (res.ok) {
            const data = await res.json();
            apiConversions = data.conversions ? data.conversions.length : 0;
        } else {
            apiError = `API Error: ${res.status} ${res.statusText}`;
        }
    } catch (e: any) {
        apiError = `Fetch Error: ${e.message}`;
    }

    // 2. Check Database
    let dbConversions = 0;
    try {
        const rows = await sql`
      SELECT icd9_code 
      FROM icd10_to_icd9_mapping 
      WHERE icd10_code = ${cleanCode}
    `;
        dbConversions = rows.length;
    } catch (e: any) {
        console.error(`DB Error: ${e.message}`);
        return;
    }

    // 3. Compare and Report
    if (apiConversions > 0 && dbConversions > 0) {
        console.log(`✅ OK: Web found ${apiConversions}, DB has ${dbConversions}`);
    } else if (apiConversions === 0 && dbConversions === 0) {
        console.log(`⚠️  MISSING IN BOTH: Code might be invalid or not mapped in GEMs.`);
    } else if (apiConversions === 0 && dbConversions > 0) {
        console.log(`❌ DISCREPANCY: Web found 0, but DB has ${dbConversions}!`);
        console.log(`   -> This indicates a bug in the API or Frontend.`);
    } else if (apiConversions > 0 && dbConversions === 0) {
        console.log(`❓ STRANGE: Web found ${apiConversions}, but DB has 0. (Maybe API uses fallback?)`);
    }

    if (apiError) {
        console.log(`   -> API Request Failed: ${apiError}`);
    }
}

async function run() {
    console.log('Starting verification of ICD-10 -> ICD-9 conversions...');
    console.log('-----------------------------------------------------');

    for (const code of TEST_CODES) {
        await verifyCode(code);
    }

    console.log('\n-----------------------------------------------------');
    console.log('Verification complete.');
}

run().catch(console.error);
