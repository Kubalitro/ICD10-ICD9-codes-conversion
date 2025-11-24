const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '../../database/data/2026 Initial ICD-10-CM Mappings.csv');
const content = fs.readFileSync(csvPath, 'utf8');
const lines = content.split('\n');

console.log('Searching for E87...');
for (const line of lines) {
    if (line.startsWith('E87')) {
        console.log('Found:', line);
        // Parse it to see columns
        // Simple split by comma might fail if description has comma, but E119 description usually doesn't.
        const parts = line.split(',');
        console.log('V22 (Idx 4):', parts[4]);
        console.log('V24 (Idx 5):', parts[5]);
        console.log('V28 (Idx 6):', parts[6]);
    }
}
