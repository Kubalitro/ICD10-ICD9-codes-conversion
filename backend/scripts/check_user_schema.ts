import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkUserSchema() {
    try {
        const { sql } = await import('../lib/db');

        console.log('Checking users table schema...');

        const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `;
        console.log('Users table columns:', columns);

    } catch (error) {
        console.error('Database error:', error);
    }
}

checkUserSchema();
