import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testConnection() {
    try {
        // Dynamic import to ensure env vars are loaded first
        const { sql } = await import('../lib/db');

        console.log('Testing database connection...');
        const result = await sql`SELECT NOW()`;
        console.log('Connection successful:', result);

        console.log('Checking users table...');
        const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
    `;

        if (tables.length > 0) {
            console.log('Users table exists.');
        } else {
            console.error('Users table does NOT exist.');
        }

    } catch (error) {
        console.error('Database error:', error);
    }
}

testConnection();
