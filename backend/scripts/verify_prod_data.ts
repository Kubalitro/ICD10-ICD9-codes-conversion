import { sql } from '../lib/db';

async function verify() {
    console.log('Verifying Production Data...');

    // 1. Check Elixhauser Categories
    console.log('\nChecking Elixhauser Categories...');
    const categories = await sql`SELECT code, name FROM elixhauser_categories WHERE code IN ('ARRHYTHMIA', 'FLUID_ELECTRO')`;
    console.log('Found categories:', categories);

    // 2. Check Elixhauser Mappings
    console.log('\nChecking Elixhauser Mappings...');
    const arrhythmiaMappings = await sql`
        SELECT COUNT(*) as count 
        FROM elixhauser_mappings 
        WHERE category_code = 'ARRHYTHMIA'
    `;
    console.log(`ARRHYTHMIA mappings count: ${arrhythmiaMappings[0].count}`);

    // 3. Check HCC Mappings
    console.log('\nChecking HCC Mappings...');
    const hccCount = await sql`SELECT COUNT(*) as count FROM hcc_mappings`;
    console.log(`Total HCC mappings: ${hccCount[0].count}`);

    const e119 = await sql`
        SELECT * FROM hcc_mappings WHERE icd10_code = 'E11.9'
    `;
    console.log('E11.9 mapping:', e119);

    const e87 = await sql`
        SELECT * FROM hcc_mappings WHERE icd10_code LIKE 'E87%'
    `;
    console.log('E87 mappings (should be empty or specific):', e87);
}

verify().catch(console.error).finally(() => process.exit());
