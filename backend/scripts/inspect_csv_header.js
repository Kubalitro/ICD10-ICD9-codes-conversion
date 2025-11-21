const fs = require('fs');
const path = 'c:\\Users\\marct\\ICD10-ICD9-codes-conversion\\database\\data\\2026 Initial ICD-10-CM Mappings.csv';

const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n').slice(0, 15);

console.log('First 15 lines:');
lines.forEach((line, i) => {
    console.log(`${i}: ${line}`);
});
