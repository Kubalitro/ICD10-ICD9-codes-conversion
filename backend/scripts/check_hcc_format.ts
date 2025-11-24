import { sql } from '../lib/db';

async function check() {
    console.log('Checking HCC format...');

    // Check for E119 (without dot)
    const e119NoDot = await sql`SELECT * FROM hcc_mappings WHERE icd10_code = 'E119'`;
    console.log('E119 (no dot):', e119NoDot);

    // Check for E11.9 (with dot)
    const e119WithDot = await sql`SELECT * FROM hcc_mappings WHERE icd10_code = 'E11.9'`;
    console.log('E11.9 (with dot):', e119WithDot);

    // Sample first 5 records
    const sample = await sql`SELECT icd10_code, hcc_category FROM hcc_mappings LIMIT 5`;
    console.log('Sample records:', sample);

    // Count total
    const total = await sql`SELECT COUNT(*) as count FROM hcc_mappings`;
    console.log('Total count:', total[0].count);
}

check().catch(console.error).finally(() => process.exit());
