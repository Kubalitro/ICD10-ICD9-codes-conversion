require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function loadHCCData() {
    try {
        console.log('Creating hcc_mappings table...');
        await sql`
      CREATE TABLE IF NOT EXISTS hcc_mappings (
        icd10_code TEXT PRIMARY KEY,
        description TEXT,
        hcc_category TEXT,
        hcc_description TEXT,
        raf_score DECIMAL
      );
    `;

        console.log('Clearing existing data...');
        await sql`DELETE FROM hcc_mappings`;

        const csvPath = path.join(__dirname, '../../database/data/2026 Initial ICD-10-CM Mappings.csv');
        console.log(`Reading CSV from ${csvPath}...`);

        const content = fs.readFileSync(csvPath, 'utf8');
        const lines = content.split('\n');

        let count = 0;
        // Skip header lines. Real data starts around line 8 or so, but let's look for lines starting with a code (e.g. A00)
        // Codes usually start with a letter.

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Simple CSV parser for this specific file format
            // We know columns are comma-separated, but descriptions might contain commas.
            // However, looking at the file, descriptions don't seem to be quoted unless they contain commas.
            // But the header WAS quoted.
            // Let's try a regex split that respects quotes, or just simple split if we trust the data.
            // The sample data showed: A0104,Typhoid arthritis,39,39,39,39,92,,Yes,Yes,Yes,Yes,Yes,No
            // No quotes in description.

            // Let's assume standard CSV parsing.
            const parts = parseCSVLine(line);

            // Check if first column looks like an ICD code (e.g. A00.0 or A000)
            // The file has codes WITHOUT dots (e.g. A0104).
            const code = parts[0];
            if (!code || !/^[A-Z][0-9]/.test(code)) continue;

            const description = parts[1];
            const hccV28 = parts[6]; // Column 6 is V28

            if (hccV28) {
                // Normalize code to have dots for consistency with our app?
                // Our app uses dots for display, but DB usually stores without?
                // Actually, Charlson DB has dots. Elixhauser DB has NO dots.
                // Let's store WITHOUT dots to match the source file, and we'll normalize in API if needed.
                // Wait, Charlson ICD-10 table HAS dots.
                // If we want to join or be consistent, maybe we should add dots?
                // The file has "A0104". Standard is "A01.04".
                // Let's add dots to be consistent with Charlson if possible, OR just handle it in API.
                // Given Elixhauser is NO dots, and this file is NO dots, let's stick to NO dots for storage
                // and handle normalization in the API (like we did for Elixhauser).

                // Also, we need HCC description and RAF score.
                // The CSV ONLY gives the Category ID (e.g. "39").
                // It does NOT give the description (e.g. "Bone/Joint/Muscle Infections/Necrosis") or the Score.
                // We might need a separate mapping for Category ID -> Description/Score.
                // For now, let's just store the Category ID.

                await sql`
          INSERT INTO hcc_mappings (icd10_code, description, hcc_category)
          VALUES (${code}, ${description}, ${hccV28})
          ON CONFLICT (icd10_code) 
          DO UPDATE SET 
            hcc_category = EXCLUDED.hcc_category,
            description = EXCLUDED.description
        `;
                count++;
            }
        }

        console.log(`Successfully loaded ${count} HCC mappings.`);

    } catch (error) {
        console.error('Error loading HCC data:', error);
    }
}

// Simple CSV line parser that handles quoted fields
function parseCSVLine(text) {
    const result = [];
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

loadHCCData();
