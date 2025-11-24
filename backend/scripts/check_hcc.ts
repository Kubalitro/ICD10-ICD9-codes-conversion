import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
import { sql } from '../lib/db';

async function check() {
    try {
        const hcc = await sql`SELECT * FROM hcc_mappings WHERE icd10_code LIKE 'E87%'`;
        console.log('HCC for E87:', hcc);
    } catch (error) {
        console.error(error);
    }
}

check();
