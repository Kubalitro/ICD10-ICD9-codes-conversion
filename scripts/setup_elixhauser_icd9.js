import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Load environment variables
const envLocalPath = path.resolve(__dirname, '../backend/.env.local');
console.log('Loading .env.local from:', envLocalPath);
dotenv.config({ path: envLocalPath });
if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);
async function main() {
    try {
        console.log('Starting Elixhauser ICD-9 setup...');
        // 1. Create table
        console.log('Creating elixhauser_icd9 table...');
        await sql `
      CREATE TABLE IF NOT EXISTS elixhauser_icd9 (
        id SERIAL PRIMARY KEY,
        code VARCHAR(20) NOT NULL,
        description TEXT,
        comorbidities TEXT[]
      );
    `;
        // Create index on code
        await sql `
      CREATE INDEX IF NOT EXISTS idx_elixhauser_icd9_code ON elixhauser_icd9(code);
    `;
        // 2. Load data
        const jsonPath = path.resolve(__dirname, '../database/data/elixhauser_icd9.json');
        const fileContent = fs.readFileSync(jsonPath, 'utf-8');
        const data = JSON.parse(fileContent);
        console.log(`Found ${Object.keys(data).length} entries to insert.`);
        // 3. Insert data
        for (const [code, info] of Object.entries(data)) {
            // Remove dots for storage to match other tables convention if needed, 
            // but user asked for dot sensitivity. Let's store as is (with dots) for now 
            // since the JSON keys have dots.
            // However, existing tables seem to use mixed conventions. 
            // Let's store CLEAN code (no dots) for consistency with search logic, 
            // but we can also store the original code if needed.
            // Wait, the user said "Las respuestas que de la web SIEMPRE deben ser CON punto."
            // So we should probably store it with dots or format it on retrieval.
            // Let's store WITHOUT dots for easier matching, and format on output.
            const cleanCode = code.replace(/\./g, '');
            const description = info.description;
            const comorbidities = info.comorbidities;
            // Check if exists
            const existing = await sql `
        SELECT id FROM elixhauser_icd9 WHERE code = ${cleanCode}
      `;
            if (existing.length === 0) {
                await sql `
          INSERT INTO elixhauser_icd9 (code, description, comorbidities)
          VALUES (${cleanCode}, ${description}, ${comorbidities})
        `;
            }
            else {
                await sql `
          UPDATE elixhauser_icd9 
          SET description = ${description}, comorbidities = ${comorbidities}
          WHERE code = ${cleanCode}
        `;
            }
        }
        console.log('Elixhauser ICD-9 data inserted.');
        // 4. Insert missing code 420.01
        console.log('Checking for missing code 420.01...');
        const missingCode = '42001'; // Stored without dots in icd9_codes usually?
        // Let's check how icd9_codes are stored.
        // Based on previous file views, search logic handles both.
        // Let's insert 420.01 into icd9_codes if not present.
        // We need to check if icd9_codes table has a description column?
        // models.py says: code = Column(String, unique=True, index=True, nullable=False)
        // It does NOT have a description column in the model shown!
        // But wait, search/route.ts says: "SELECT code FROM icd9_codes"
        const existingCode = await sql `
      SELECT code FROM icd9_codes WHERE code = '42001' OR code = '420.01'
    `;
        if (existingCode.length === 0) {
            console.log('Inserting 420.01 into icd9_codes...');
            // Try inserting with dot as user requested "420.01 no se encuentra"
            // But usually we want to be consistent.
            // Let's insert '42001' to match the "clean" version usually used for search.
            await sql `
        INSERT INTO icd9_codes (code) VALUES ('42001')
      `;
            console.log('Inserted 42001.');
        }
        else {
            console.log('Code 420.01 already exists.');
        }
        console.log('Setup complete!');
    }
    catch (error) {
        console.error('Error in setup:', error);
        process.exit(1);
    }
}
main();
