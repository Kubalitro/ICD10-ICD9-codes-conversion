import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { sql } from '../lib/db';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Simple CSV parser that handles quoted fields
function parseCSVLine(text: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

async function reloadHCC() {
    try {
        console.log('Reloading HCC data...');

        // Clear existing data
        console.log('Clearing hcc_mappings table...');
        await sql`DELETE FROM hcc_mappings`;

        const csvPath = path.join(__dirname, '../../database/data/2026 Initial ICD-10-CM Mappings.csv');
        console.log(`Reading CSV from ${csvPath}...`);

        const content = fs.readFileSync(csvPath, 'utf8');
        // Handle Windows line endings
        const lines = content.split(/\r?\n/);

        console.log(`Total lines in CSV: ${lines.length}`);

        let count = 0;
        let batch = [];
        const BATCH_SIZE = 1000;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const parts = parseCSVLine(line);

            // Index 0: Code
            // Index 1: Description
            // Index 6: CMS-HCC Model Category V28

            const code = parts[0];
            const description = parts[1];
            const hccV28 = parts[6];

            // Basic validation: Code should look like an ICD code (start with letter, contain numbers)
            // And we only care if it has an HCC mapping (V28 is not empty)
            if (code && /^[A-Z][0-9]/.test(code) && hccV28) {
                // Normalize code: The CSV has "A0104" (no dot).
                // Our DB usually expects "A0104" for storage if we want to match exact, 
                // OR we might want to store it as is.
                // The previous script stored it as is.
                // E119 is in the file as E119.

                batch.push({
                    icd10_code: code,
                    description: description,
                    hcc_category: hccV28
                });

                if (batch.length >= BATCH_SIZE) {
                    await insertBatch(batch);
                    count += batch.length;
                    console.log(`Loaded ${count} records...`);
                    batch = [];
                }
            }
        }

        if (batch.length > 0) {
            await insertBatch(batch);
            count += batch.length;
        }

        console.log(`Successfully loaded ${count} HCC mappings.`);

    } catch (error) {
        console.error('Error reloading HCC data:', error);
    }
}

async function insertBatch(batch: any[]) {
    // Construct values for bulk insert
    // We can't use ${...} for array of objects directly with neon/postgres helper usually in this way without a helper
    // So we'll loop or use a constructed query.
    // For safety and simplicity with the `sql` tag, we can loop. 
    // BUT looping 1000 times is slow.
    // Let's try to do it in parallel or use a transaction?
    // Or just loop. 70k records might take a while.
    // Actually, let's just loop for now, it's robust.

    for (const item of batch) {
        await sql`
            INSERT INTO hcc_mappings (icd10_code, description, hcc_category)
            VALUES (${item.icd10_code}, ${item.description}, ${item.hcc_category})
            ON CONFLICT (icd10_code) DO UPDATE SET
                description = EXCLUDED.description,
                hcc_category = EXCLUDED.hcc_category
        `;
    }
}

reloadHCC();
