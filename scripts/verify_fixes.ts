
import { neon } from '@neondatabase/serverless';
import * as path from 'path';
import * as dotenv from 'dotenv';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = path.resolve(__dirname, '../backend/.env');
const envLocalPath = path.resolve(__dirname, '../backend/.env.local');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });
console.log('Loading .env.local from:', envLocalPath);
dotenv.config({ path: envLocalPath });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function verify() {
    try {
        console.log('Starting verification...');

        // 1. Verify Charlson for 398.91 (should be 1)
        console.log('\n--- Verifying Charlson for 398.91 ---');

        // Test with dots
        const charlsonWithDots = await sql`
      SELECT score FROM charlson_icd9 WHERE code = '398.91'
    `;
        console.log('Charlson 398.91 score:', charlsonWithDots[0]?.score);

        // Test with clean code logic (simulated)
        const charlsonClean = await sql`
      SELECT score FROM charlson_icd9 WHERE replace(code, '.', '') = '39891'
    `;
        console.log('Charlson 39891 (clean) score:', charlsonClean[0]?.score);

        // 2. Verify Search for 420.01
        console.log('\n--- Verifying Search for 420.01 ---');
        const search42001 = await sql`
      SELECT code FROM icd9_codes WHERE code = '42001' OR code = '420.01'
    `;
        console.log('Found 420.01:', search42001.length > 0 ? search42001[0].code : 'Not found');

        // 3. Verify Elixhauser for 398.91
        console.log('\n--- Verifying Elixhauser for 398.91 ---');
        const elixhauser = await sql`
      SELECT * FROM elixhauser_icd9 WHERE code = '39891' OR code = '398.91'
    `;
        console.log('Elixhauser 398.91 found:', elixhauser.length > 0);
        if (elixhauser.length > 0) {
            console.log('Comorbidities:', elixhauser[0].comorbidities);
        }

        console.log('\nVerification complete.');

    } catch (error) {
        console.error('Verification error:', error);
    }
}

verify();
