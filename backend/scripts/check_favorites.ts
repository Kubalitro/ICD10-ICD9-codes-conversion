import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkFavorites() {
    try {
        const { sql } = await import('../lib/db');

        console.log('Checking favorites...');

        const items = await sql`SELECT * FROM saved_list_items`;
        console.log('Saved items:', items);

        const lists = await sql`SELECT * FROM saved_lists`;
        console.log('Saved lists:', lists);

    } catch (error) {
        console.error('Database error:', error);
    }
}

checkFavorites();
