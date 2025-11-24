
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function checkSchema() {
    const { sql } = await import('../lib/db');

    try {
        console.log('Checking charlson_icd10 table...');
        const icd10Columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'charlson_icd10'
    `;
        console.log('charlson_icd10 columns:', icd10Columns);

        console.log('\nChecking charlson_icd9 table...');
        const icd9Columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'charlson_icd9'
    `;
        console.log('charlson_icd9 columns:', icd9Columns);

    } catch (e) {
        console.error('Error:', e);
    }
}

checkSchema();
