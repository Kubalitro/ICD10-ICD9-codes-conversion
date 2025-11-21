const testCodes = ['A0104', 'E11.9', 'I10'];
const testSystem = 'icd10';

fetch('http://localhost:3000/api/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codes: testCodes, system: testSystem })
})
    .then(res => res.json())
    .then(data => {
        console.log('Batch API Response:');
        console.log(JSON.stringify(data, null, 2));
    })
    .catch(err => console.error('Error:', err));
