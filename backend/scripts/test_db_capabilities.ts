
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function test() {
    const { sql } = await import('../lib/db');
    try {
        console.log('Testing string query with parameters...');
        // @ts-ignore
        const result = await sql('SELECT 1 as val WHERE 1 = $1', [1]);
        console.log('Result:', result);
    } catch (e) {
        console.error('Error with string query:', e);
    }

    try {
        console.log('Testing template literal...');
        const result = await sql`SELECT 1 as val`;
        console.log('Result:', result);
    } catch (e) {
        console.error('Error with template literal:', e);
    }
}

test();
