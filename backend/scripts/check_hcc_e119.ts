import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
import { sql } from '../lib/db';

async function check() {
    try {
        const e119 = await sql`SELECT * FROM hcc_mappings WHERE icd10_code = 'E119' OR icd10_code = 'E11.9'`;
        console.log('HCC for E11.9:', e119);

        const count = await sql`SELECT COUNT(*) FROM hcc_mappings`;
        console.log('Total HCC mappings:', count[0].count);
    } catch (error) {
        console.error(error);
    }
}

check();
