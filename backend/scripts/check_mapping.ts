import { sql } from '../lib/db';

async function check() {
    try {
        const n186 = await sql`SELECT * FROM elixhauser_mappings WHERE icd10_code = 'N18.6' OR icd10_code = 'N186'`;
        console.log('N18.6:', n186);

        const k703 = await sql`SELECT * FROM elixhauser_mappings WHERE icd10_code = 'K70.3' OR icd10_code = 'K703'`;
        console.log('K70.3:', k703);
    } catch (error) {
        console.error(error);
    }
}

check();
