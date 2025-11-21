import path from 'path';
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
const { sql } = require('../lib/db');

async function checkHCC() {
    try {
        const result = await sql`
      SELECT * FROM hcc_mappings WHERE icd10_code = 'A0104'
    `;
        console.log('HCC Data for A0104:', result);

        const count = await sql`SELECT COUNT(*) FROM hcc_mappings`;
        console.log('Total rows:', count);
    } catch (error) {
        console.error('Error:', error);
    }
}

checkHCC();
