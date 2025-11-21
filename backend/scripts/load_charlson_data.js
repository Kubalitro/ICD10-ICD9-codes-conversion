require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

const sql = neon(process.env.DATABASE_URL);

async function loadCharlsonData() {
    console.log('Starting Charlson data load...');

    try {
        // Load JSON data
        const charlsonIcd10Data = JSON.parse(
            fs.readFileSync(path.join(__dirname, '../../database/data/charlson_icd10.json'), 'utf8')
        );
        const charlsonIcd9Data = JSON.parse(
            fs.readFileSync(path.join(__dirname, '../../database/data/charlson_icd9.json'), 'utf8')
        );

        // Create tables if they don't exist
        console.log('Creating charlson_icd10 table...');
        await sql`
      CREATE TABLE IF NOT EXISTS charlson_icd10 (
        code VARCHAR(10) PRIMARY KEY,
        condition VARCHAR(100) NOT NULL,
        score INTEGER NOT NULL
      )
    `;

        console.log('Creating charlson_icd9 table...');
        await sql`
      CREATE TABLE IF NOT EXISTS charlson_icd9 (
        code VARCHAR(10) PRIMARY KEY,
        condition VARCHAR(100) NOT NULL,
        score INTEGER NOT NULL
      )
    `;

        // Check if data already exists
        const icd10Count = await sql`SELECT COUNT(*) as count FROM charlson_icd10`;
        const icd9Count = await sql`SELECT COUNT(*) as count FROM charlson_icd9`;

        if (icd10Count[0].count > 0) {
            console.log(`ICD-10 Charlson data already exists (${icd10Count[0].count} records). Clearing...`);
            await sql`TRUNCATE TABLE charlson_icd10`;
        }

        if (icd9Count[0].count > 0) {
            console.log(`ICD-9 Charlson data already exists (${icd9Count[0].count} records). Clearing...`);
            await sql`TRUNCATE TABLE charlson_icd9`;
        }

        // Load ICD-10 Charlson data  
        console.log('Loading ICD-10 Charlson data...');
        let icd10Loaded = 0;
        for (const [code, data] of Object.entries(charlsonIcd10Data)) {
            await sql`
        INSERT INTO charlson_icd10 (code, condition, score)
        VALUES (${code}, ${data.condition}, ${data.score})
      `;
            icd10Loaded++;
            if (icd10Loaded % 50 === 0) {
                console.log(`  Loaded ${icd10Loaded} ICD-10 codes...`);
            }
        }
        console.log(`✓ Loaded ${icd10Loaded} ICD-10 Charlson codes`);

        // Load ICD-9 Charlson data
        console.log('Loading ICD-9 Charlson data...');
        let icd9Loaded = 0;
        for (const [code, data] of Object.entries(charlsonIcd9Data)) {
            await sql`
        INSERT INTO charlson_icd9 (code, condition, score)
        VALUES (${code}, ${data.condition}, ${data.score})
      `;
            icd9Loaded++;
            if (icd9Loaded % 50 === 0) {
                console.log(`  Loaded ${icd9Loaded} ICD-9 codes...`);
            }
        }
        console.log(`✓ Loaded ${icd9Loaded} ICD-9 Charlson codes`);

        // Verify the data
        console.log('\nVerifying data...');
        const testCode = 'E08.2';
        const testResult = await sql`
      SELECT * FROM charlson_icd10 WHERE code = ${testCode}
    `;
        if (testResult.length > 0) {
            console.log(`✓ Test query successful: ${testCode} => Score: ${testResult[0].score}, Condition: ${testResult[0].condition}`);
        } else {
            console.log(`✗ Test query failed: ${testCode} not found`);
        }

        console.log('\n✅ Charlson data load complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error loading Charlson data:', error);
        process.exit(1);
    }
}

loadCharlsonData();
