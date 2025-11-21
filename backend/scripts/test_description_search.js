// Test enhanced description search with scores
const testQueries = ['diabetes', 'MI', 'heart attack'];

async function testSearch(query) {
    console.log(`\n=== Testing: "${query}" ===`);
    const response = await fetch(`http://localhost:3000/api/search-description-enhanced?query=${encodeURIComponent(query)}`);
    const data = await response.json();

    console.log(`Found: ${data.count} results`);
    if (data.expandedQueries) {
        console.log(`Expanded to: ${data.expandedQueries.join(', ')}`);
    }

    data.results.slice(0, 3).forEach(result => {
        console.log(`\n  Code: ${result.code} (${result.system})`);
        console.log(`  Description: ${result.description.substring(0, 60)}...`);
        if (result.scores) {
            if (result.scores.charlson) {
                console.log(`  Charlson: ${result.scores.charlson.score} (${result.scores.charlson.condition})`);
            }
            if (result.scores.elixhauser) {
                console.log(`  Elixhauser: ${result.scores.elixhauser.count} categories`);
            }
            if (result.scores.hcc) {
                console.log(`  HCC: ${result.scores.hcc.category}`);
            }
        } else {
            console.log('  No scores available');
        }
    });
}

(async () => {
    for (const query of testQueries) {
        await testSearch(query);
    }
})();
