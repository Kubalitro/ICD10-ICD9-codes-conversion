
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function loadCharlsonData() {
    const { sql } = await import('../lib/db');

    try {
        // Read the charlson_icd10.json file
        const jsonPath = path.resolve(__dirname, '../../database/data/charlson_icd10.json');
        console.log(`Reading Charlson data from: ${jsonPath}`);

        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        const codes = Object.keys(jsonData);
        console.log(`Found ${codes.length} Charlson mappings`);

        let inserted = 0;
        for (const icd10Code of codes) {
            const mapping = jsonData[icd10Code];
            try {
                await sql`
          INSERT INTO charlson_icd10 (icd10_code, condition, score)
          VALUES (${icd10Code}, ${mapping.condition}, ${mapping.score})
          ON CONFLICT (icd10_code) DO NOTHING
        `;
                inserted++;
                if (inserted % 50 === 0) {
                    console.log(`Inserted ${inserted}/${codes.length}...`);
                }
            } catch (e) {
                console.error(`Error inserting ${icd10Code}:`, e.message);
            }
        }

        console.log(`\n✅ Successfully loaded ${inserted} Charlson mappings!`);

        // Verify
        const count = await sql`SELECT COUNT(*) as count FROM charlson_icd10`;
        console.log(`Total rows in table: ${count[0].count}`);

    } catch (e) {
        console.error('Error loading Charlson data:', e);
    }
}

loadCharlsonData();
