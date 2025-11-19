
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL is not set');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function check() {
    console.log('Checking M545...');

    const mapping = await sql`SELECT * FROM icd10_to_icd9_mapping WHERE icd10_code = 'M545'`;
    console.log(`Mapping count: ${mapping.length}`);

    const description = await sql`SELECT * FROM icd10_codes WHERE code = 'M545'`;
    console.log(`Description count: ${description.length}`);
}

check().catch(console.error);
