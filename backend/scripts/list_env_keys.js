const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../.env.production');
const content = fs.readFileSync(envPath, 'utf8');
const parsed = dotenv.parse(content);

console.log('Keys in .env.production:');
Object.keys(parsed).forEach(key => console.log(key));
