import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
import { sql } from '../lib/db';

async function verify() {
    try {
        console.log('Checking for E87 codes in icd10_codes...');
        const codes = await sql`
      SELECT code, description 
      FROM icd10_codes 
      WHERE code LIKE 'E87%'
      LIMIT 5
    `;
        console.log('Found ICD-10 codes:', codes);

        console.log('\nChecking for E87 mappings in elixhauser_mappings...');
        const mappings = await sql`
      SELECT * 
      FROM elixhauser_mappings 
      WHERE icd10_code LIKE 'E87%'
    `;
        console.log('Found mappings:', mappings);

        if (mappings.length === 0) {
            console.log('\nCONFIRMED: No Elixhauser mappings found for E87.');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

verify();
