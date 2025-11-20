
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envLocalPath = path.resolve(process.cwd(), 'backend/.env.local');
dotenv.config({ path: envLocalPath });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function verify() {
    console.log('Verifying Enhanced Elixhauser ICD-9 Search...');

    // Test cases:
    // 1. Exact code: 398.91 -> CHF
    // 2. Wildcard expansion: 428.0 -> CHF (from 428.x)
    // 3. Range expansion: 425.4 -> CHF (from 425.4-425.9)

    const testCases = [
        { code: '39891', expectedComorbidity: 'Congestive heart failure' },
        { code: '4280', expectedComorbidity: 'Congestive heart failure' },
        { code: '4254', expectedComorbidity: 'Congestive heart failure' }
    ];

    for (const test of testCases) {
        const result = await sql`
      SELECT * FROM elixhauser_icd9 WHERE code = ${test.code}
    `;

        if (result.length > 0) {
            const comorbidities = result[0].comorbidities;
            const hasComorbidity = comorbidities.includes(test.expectedComorbidity);
            if (hasComorbidity) {
                console.log(`✅ Code ${test.code} found with comorbidity ${test.expectedComorbidity}`);
            } else {
                console.log(`❌ Code ${test.code} found but MISSING comorbidity ${test.expectedComorbidity}. Found: ${comorbidities}`);
            }
        } else {
            console.log(`❌ Code ${test.code} NOT FOUND in database`);
        }
    }
}

verify().catch(console.error);
