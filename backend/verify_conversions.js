
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');

// Validate Environment
if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL is not set in .env.local');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const BASE_URL = 'http://localhost:3000';

const TEST_CODES = [
    'E10.10',   // Type 1 DM with ketoacidosis
    'I10',      // Essential hypertension
    'J44.9',    // COPD, unspecified
    'F41.1',    // Generalized anxiety disorder
    'M54.5',    // Low back pain (Historical check)
    'M54.50',   // Low back pain, unspecified
    'R05',      // Cough
    'R05.9',    // Cough, unspecified
    'S82.801A', // Fracture of other parts of right lower leg, initial
    'Z00.00',   // Encntr for general adult medical exam w/o abnormal findings
    'A00.0',    // Cholera due to Vibrio cholerae 01, biovar cholerae
    'C50.911',  // Malignant neoplasm of unsp site of right female breast
    'O80',      // Encounter for full-term uncomplicated delivery
    'E11.9',    // Type 2 DM without complications
    'B34.9',    // Viral infection, unspecified
    'K21.9',    // GERD without esophagitis
    'N39.0',    // UTI, site not specified
    'R10.9',    // Unspecified abdominal pain
    'H10.9',    // Unspecified conjunctivitis
    'J02.9',    // Acute pharyngitis, unspecified
    'L03.90',   // Cellulitis, unspecified part of body
    'M25.50',   // Pain in unspecified joint
    'R51.9',    // Headache, unspecified
    'U07.1',    // COVID-19
];

function log(message) {
    console.log(message);
    fs.appendFileSync('results.log', message + '\n');
}

async function verifyCode(code) {
    const cleanCode = code.replace(/\./g, '');
    let apiResult = { count: 0, error: null };
    let dbResult = { count: 0, error: null };

    // 1. Check API
    try {
        const res = await fetch(`${BASE_URL}/api/convert?code=${code}&from=icd10&to=icd9`);
        if (res.ok) {
            const data = await res.json();
            apiResult.count = data.conversions ? data.conversions.length : 0;
        } else {
            apiResult.error = `Status ${res.status}`;
        }
    } catch (e) {
        apiResult.error = e.message;
    }

    // 2. Check Database
    try {
        // Check for exact mapping first
        const rows = await sql`
      SELECT icd9_code 
      FROM icd10_to_icd9_mapping 
      WHERE icd10_code = ${cleanCode}
    `;
        dbResult.count = rows.length;
    } catch (e) {
        dbResult.error = e.message;
    }

    // 3. Log Results
    const paddedCode = code.padEnd(10);

    if (apiResult.error || dbResult.error) {
        log(`ERROR      ${paddedCode} | API Err: ${apiResult.error || 'None'} | DB Err: ${dbResult.error || 'None'} | DB Count: ${dbResult.count}`);
        return;
    }

    if (apiResult.count > 0 && dbResult.count > 0) {
        log(`MATCH      ${paddedCode} | Web: ${apiResult.count} | DB: ${dbResult.count}`);
    } else if (apiResult.count === 0 && dbResult.count === 0) {
        log(`EMPTY      ${paddedCode} | Web: 0 | DB: 0 | NO MAPPING FOUND`);
    } else if (apiResult.count === 0 && dbResult.count > 0) {
        log(`MISSING    ${paddedCode} | Web: 0 | DB: ${dbResult.count} | MISSING IN WEB!`);
    } else if (apiResult.count > 0 && dbResult.count === 0) {
        log(`EXTRA      ${paddedCode} | Web: ${apiResult.count} | DB: 0 | WEB HAS MORE`);
    }
}

async function run() {
    fs.writeFileSync('results.log', ''); // Clear file
    log('Starting Comprehensive Verification...');
    log('================================================================');
    log('Code       | Status | Details');
    log('----------------------------------------------------------------');

    for (const code of TEST_CODES) {
        await verifyCode(code);
    }

    log('================================================================');
    log('Verification Complete.');
}

run().catch(e => {
    console.error('Fatal Script Error:', e);
    process.exit(1);
});
