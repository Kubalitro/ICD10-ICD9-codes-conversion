import { sql } from '../lib/db';

async function checkSchema() {
    try {
        const result = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'elixhauser_mappings'
    `;
        console.log('Schema for elixhauser_mappings:', result);
    } catch (error) {
        console.error('Error:', error);
    }
}

checkSchema();
