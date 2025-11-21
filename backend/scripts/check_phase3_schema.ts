import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkSchema() {
    try {
        // Dynamic import to ensure env vars are loaded first
        const { sql } = await import('../lib/db');

        console.log('Checking schema for Phase 3...');

        const tables = ['user_search_history', 'saved_lists', 'saved_list_items'];

        for (const table of tables) {
            const result = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${table}
      `;

            if (result.length > 0) {
                console.log(`✅ Table '${table}' exists.`);
            } else {
                console.error(`❌ Table '${table}' does NOT exist.`);
            }
        }

    } catch (error) {
        console.error('Database error:', error);
    }
}

checkSchema();
