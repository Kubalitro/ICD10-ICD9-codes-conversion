
async function testBatchApi() {
    try {
        const response = await fetch('http://localhost:3000/api/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                codes: ['E10.10', 'I10', 'J44.9'],
                system: 'icd10'
            })
        });

        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Response:', text);

    } catch (error) {
        console.error('Error:', error);
    }
}

testBatchApi();
