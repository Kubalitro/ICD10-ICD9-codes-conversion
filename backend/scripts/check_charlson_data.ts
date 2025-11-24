
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function checkCharlsonData() {
    const { sql } = await import('../lib/db');

    try {
        console.log('Checking charlson_icd10 table data...');
        const count = await sql`SELECT COUNT(*) as count FROM charlson_icd10`;
        console.log(`Total rows: ${count[0].count}`);

        if (count[0].count > 0) {
            const sample = await sql`SELECT * FROM charlson_icd10 LIMIT 10`;
            console.log('\nSample data:');
            sample.forEach(row => {
                console.log(`  ${row.icd10_code} -> ${row.condition} (Score: ${row.score})`);
            });
        } else {
            console.log('Table is empty!');
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

checkCharlsonData();
