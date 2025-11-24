const { spawn } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');

// Load production env vars
const envPath = path.resolve(__dirname, '../.env.production');
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error('Error loading .env.production:', result.error);
    process.exit(1);
}

console.log('Loaded production environment variables.');
if (process.env.DATABASE_URL) {
    console.log('DATABASE_URL is set (length: ' + process.env.DATABASE_URL.length + ')');
} else {
    console.error('DATABASE_URL is NOT set after loading .env.production');
    console.log('Parsed:', result.parsed);
}

const script = process.argv[2];
if (!script) {
    console.error('Usage: node scripts/run_prod.js <script_path>');
    process.exit(1);
}

// Run the script using npx tsx
// We pass the current process.env which now includes the loaded vars
const child = spawn('npx', ['tsx', script], {
    stdio: 'inherit',
    shell: true, // Needed for npx on Windows sometimes
    env: { ...process.env }
});

child.on('close', (code) => {
    process.exit(code);
});
