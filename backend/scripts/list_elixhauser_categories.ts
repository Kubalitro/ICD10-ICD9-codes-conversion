import { sql } from '../lib/db';

async function listCategories() {
    try {
        const categories = await sql`SELECT * FROM elixhauser_categories ORDER BY code`;
        console.log(JSON.stringify(categories, null, 2));
    } catch (error) {
        console.error(error);
    }
}

listCategories();
