
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';


const DATA_DIR = path.resolve(process.cwd(), 'database/data');


// Load data files
const enhancedRules = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'enhanced_icd9_codes.json'), 'utf-8'));
const icd9ToIcd10 = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'icd9_to_icd10.json'), 'utf-8'));
const icd10Descriptions = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'icd10_descriptions.json'), 'utf-8'));

interface ComorbidityEntry {
    description: string;
    comorbidities: string[];
}

const outputMapping: Record<string, ComorbidityEntry> = {};

// Helper to clean code (remove dots)
function clean(code: string): string {
    return code.replace(/\./g, '');
}

// Helper to check if a code matches a rule
function matchesRule(code: string, rule: string): boolean {
    const cleanCode = clean(code);

    // Range
    if (rule.includes('-')) {
        const [startStr, endStr] = rule.split('-');
        const start = clean(startStr).replace(/x/g, '');
        const end = clean(endStr).replace(/x/g, '');

        // Check if starts with start or end prefix
        if (cleanCode.startsWith(start)) return true;
        if (cleanCode.startsWith(end)) return true;

        // Check if strictly between
        return cleanCode > start && cleanCode < end;
    }

    // Wildcard
    if (rule.toLowerCase().endsWith('x')) {
        const prefix = clean(rule).replace(/x/g, '');
        return cleanCode.startsWith(prefix);
    }

    // Exact
    return cleanCode === clean(rule);
}

console.log('Generating enhanced Elixhauser mapping...');

// Invert enhancedRules to be Rule -> Comorbidity
const ruleToComorbidity: { rule: string; comorbidity: string }[] = [];
for (const [comorbidity, rules] of Object.entries(enhancedRules)) {
    for (const rule of (rules as string[])) {
        ruleToComorbidity.push({ rule, comorbidity });
    }
}

// Iterate over all valid ICD-9 codes
let matchCount = 0;
const allIcd9Codes = Object.keys(icd9ToIcd10);
console.log(`Checking ${allIcd9Codes.length} ICD-9 codes against ${ruleToComorbidity.length} rules...`);

for (const icd9Code of allIcd9Codes) {
    const matchedComorbidities = new Set<string>();

    for (const { rule, comorbidity } of ruleToComorbidity) {
        if (matchesRule(icd9Code, rule)) {
            matchedComorbidities.add(comorbidity);
        }
    }

    if (matchedComorbidities.size > 0) {
        // Get description from ICD-10 mapping
        let description = '';
        const mappings = icd9ToIcd10[icd9Code];
        if (mappings && mappings.length > 0) {
            const icd10Code = mappings[0].icd10;
            description = icd10Descriptions[icd10Code] || '';
        }

        outputMapping[icd9Code] = {
            description: description,
            comorbidities: Array.from(matchedComorbidities)
        };
        matchCount++;
    }
}

console.log(`Found ${matchCount} matching ICD-9 codes.`);

// Write output
const outputPath = path.join(DATA_DIR, 'enhanced_elixhauser_icd9_mapping.json');
fs.writeFileSync(outputPath, JSON.stringify(outputMapping, null, 2));
console.log(`Wrote mapping to ${outputPath}`);
