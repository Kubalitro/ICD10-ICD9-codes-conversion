import { sql } from '../lib/db';

async function checkElixhauserTable() {
    try {
        const result = await sql`
      SELECT * FROM elixhauser_icd9 LIMIT 1
    `;
        console.log('Sample row from elixhauser_icd9:', result);
    } catch (error) {
        console.error('Error:', error);
    }
}

checkElixhauserTable();
