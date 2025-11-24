
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function testPg() {
    console.log('Testing PG connection...');
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected successfully with pg!');
        const res = await client.query('SELECT NOW()');
        console.log('Time:', res.rows[0]);
        await client.end();
    } catch (err) {
        console.error('❌ Connection failed:', err);
    }
}

testPg();
