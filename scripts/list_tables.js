import { neon } from '@neondatabase/serverless';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envLocalPath = path.resolve(__dirname, '../backend/.env.local');
dotenv.config({ path: envLocalPath });
const sql = neon(process.env.DATABASE_URL);
async function listTables() {
    try {
        const result = await sql `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
        console.log('Tables:', result.map(r => r.table_name));
    }
    catch (e) {
        console.error(e);
    }
}
listTables();
