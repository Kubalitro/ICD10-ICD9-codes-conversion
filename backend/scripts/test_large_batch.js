
async function testLargeBatch() {
    // Comprehensive list of 100+ common ICD-10 codes
    const largeBatchCodes = [
        // Diabetes (E10-E14)
        'E10.10', 'E10.21', 'E10.22', 'E10.29', 'E10.9', 'E11.00', 'E11.21', 'E11.22',
        'E11.29', 'E11.65', 'E11.9', 'E13.9',

        // Hypertension (I10-I16)
        'I10', 'I11.0', 'I11.9', 'I12.0', 'I12.9', 'I13.0', 'I13.10', 'I15.0', 'I15.9',

        // COPD & Respiratory (J40-J47)
        'J44.0', 'J44.1', 'J44.9', 'J45.20', 'J45.30', 'J45.40', 'J45.50', 'J45.901',

        // Heart Failure & Heart Disease (I50, I21, I25)
        'I50.1', 'I50.20', 'I50.21', 'I50.22', 'I50.23', 'I50.30', 'I50.31', 'I50.32',
        'I50.33', 'I50.40', 'I50.41', 'I50.42', 'I50.43', 'I50.9',
        'I21.01', 'I21.02', 'I21.09', 'I21.11', 'I21.19', 'I21.21', 'I21.29', 'I21.3', 'I21.4',
        'I25.10', 'I25.110', 'I25.111', 'I25.118', 'I25.119', 'I25.2', 'I25.5', 'I25.6', 'I25.9',

        // CKD (N18)
        'N18.1', 'N18.2', 'N18.3', 'N18.4', 'N18.5', 'N18.6', 'N18.9',

        // Stroke/CVA (I63, I69)
        'I63.011', 'I63.012', 'I63.019', 'I63.30', 'I63.40', 'I63.50', 'I63.9',
        'I69.351', 'I69.354', 'I69.359',

        // Dementia & Alzheimer's (F01-F03, G30)
        'F01.50', 'F01.51', 'F02.80', 'F02.81', 'F03.90', 'F03.91',
        'G30.0', 'G30.1', 'G30.8', 'G30.9',

        // Cancer (C00-C97)
        'C18.0', 'C18.1', 'C18.2', 'C18.7', 'C18.9', 'C20', 'C34.10', 'C34.90',
        'C50.011', 'C50.012', 'C50.111', 'C50.112', 'C50.911', 'C50.912',
        'C61', 'C79.51', 'C79.9',

        // Depression & Anxiety (F32-F33, F41)
        'F32.0', 'F32.1', 'F32.2', 'F32.9', 'F33.0', 'F33.1', 'F33.2', 'F33.9',
        'F41.0', 'F41.1', 'F41.9',

        // Obesity (E66)
        'E66.01', 'E66.09', 'E66.1', 'E66.2', 'E66.3', 'E66.8', 'E66.9',

        // Liver Disease (K70-K77)
        'K70.0', 'K70.10', 'K70.2', 'K70.30', 'K70.9', 'K72.00', 'K72.90', 'K74.0', 'K74.60', 'K76.0',

        // Atrial Fibrillation (I48)
        'I48.0', 'I48.1', 'I48.2', 'I48.91',

        // Peripheral Vascular Disease (I70-I73)
        'I70.0', 'I70.201', 'I70.25', 'I73.9'
    ];

    console.log(`Testing batch processing with ${largeBatchCodes.length} codes...`);
    console.log('Codes:', largeBatchCodes.join(', '));
    console.log('\nSending request to API...\n');

    const startTime = Date.now();

    try {
        const response = await fetch('http://localhost:3000/api/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                codes: largeBatchCodes,
                system: 'icd10'
            })
        });

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        console.log(`Status: ${response.status}`);
        console.log(`Response time: ${duration} seconds`);

        if (response.ok) {
            const data = await response.json();

            console.log('\n=== SUMMARY ===');
            console.log(`Total Input Codes: ${data.summary.totalInputCodes}`);
            console.log(`Successful Conversions: ${data.summary.successfulConversions}`);
            console.log(`Failed Conversions: ${data.summary.failedConversions}`);

            console.log('\n=== CHARLSON COMORBIDITY INDEX ===');
            console.log(`Total Score: ${data.aggregatedCharlson.totalScore}`);
            console.log(`Conditions (${data.aggregatedCharlson.conditions.length}):`);
            data.aggregatedCharlson.conditions.forEach(c => {
                console.log(`  - ${c.condition}: Score ${c.score} (${c.codes.length} codes)`);
            });

            console.log('\n=== ELIXHAUSER COMORBIDITIES ===');
            console.log(`Total Categories: ${data.aggregatedElixhauser.totalCategories}`);
            console.log('Categories:');
            data.aggregatedElixhauser.categories.slice(0, 10).forEach(c => {
                console.log(`  - ${c.name} (${c.icdCodes.length} codes)`);
            });
            if (data.aggregatedElixhauser.categories.length > 10) {
                console.log(`  ... and ${data.aggregatedElixhauser.categories.length - 10} more`);
            }

            console.log('\n=== SAMPLE CONVERSIONS (first 5) ===');
            data.conversions.slice(0, 5).forEach(conv => {
                console.log(`${conv.sourceCode} -> ${conv.targetCodes.join(', ')}`);
                if (conv.scores?.charlson) {
                    console.log(`  Charlson: ${conv.scores.charlson.condition} (${conv.scores.charlson.score})`);
                }
                if (conv.scores?.elixhauser) {
                    console.log(`  Elixhauser: ${conv.scores.elixhauser.categories.slice(0, 3).join(', ')}`);
                }
            });

            console.log('\n✅ Large batch test completed successfully!');

        } else {
            const errorText = await response.text();
            console.error('Error response:', errorText);
        }

    } catch (error) {
        console.error('Request failed:', error.message);
    }
}

testLargeBatch();
