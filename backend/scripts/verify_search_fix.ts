
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function verify() {
    const { sql } = await import('../lib/db');

    const testCases = [
        { query: 'CKD stage 3', expectedCode: 'N18.3' },
        { query: 'COPD exacerbation', expectedCode: 'J44.1' },
        { query: 'diabetes ketoacidosis', expectedCode: 'E10.10' } // Example
    ];

    console.log('Verifying search logic...');

    for (const { query, expectedCode } of testCases) {
        console.log(`\nTesting query: "${query}"`);

        // Simulate the API logic
        // 1. Expand synonyms (simplified for test, assuming "CKD" -> "chronic kidney disease")
        // In the real API, this comes from expandQueryWithSynonyms. 
        // Here I'll just manually expand to what we expect the synonym expansion to produce for the core terms

        let expandedQueries = [query];
        if (query.includes('CKD')) {
            expandedQueries.push(query.replace('CKD', 'chronic kidney disease'));
        }
        if (query.includes('COPD')) {
            expandedQueries.push(query.replace('COPD', 'chronic obstructive pulmonary disease'));
        }

        let found = false;

        for (const expandedQuery of expandedQueries) {
            const terms = expandedQuery.trim().split(/\s+/).filter(t => t.length > 0);
            if (terms.length === 0) continue;

            const conditions = terms.map((_, i) => `description ~* $${i + 1}`).join(' AND ');
            const sqlQuery = `
        SELECT code, description
        FROM icd10_codes
        WHERE ${conditions}
        ORDER BY LENGTH(description)
        LIMIT 5
      `;

            const params = terms.map(term => {
                const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                return `(^|[^a-z])${escapedTerm}([^a-z]|$)`;
            });

            try {
                // @ts-ignore
                const results = await sql(sqlQuery, params);

                if (results.length > 0) {
                    console.log(`  Found ${results.length} results for expansion: "${expandedQuery}"`);
                    results.forEach((r: any) => console.log(`    - ${r.code}: ${r.description}`));

                    if (results.some((r: any) => r.code.includes(expectedCode) || r.code === expectedCode)) {
                        console.log(`  ✅ Success: Found expected code ${expectedCode}`);
                        found = true;
                    }
                } else {
                    console.log(`  No results for expansion: "${expandedQuery}"`);
                }
            } catch (e) {
                console.error('  Error executing query:', e);
            }
        }

        if (!found) {
            console.error(`  ❌ Failed: Did not find ${expectedCode} for query "${query}"`);
        }
    }
}

verify();
