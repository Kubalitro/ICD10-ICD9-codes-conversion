import * as dotenv from 'dotenv';
import path from 'path';

console.log('Loading production environment variables...');
const result = dotenv.config({ path: path.resolve(__dirname, '../.env.production') });

if (result.error) {
    console.error('Error loading .env.production:', result.error);
} else {
    console.log('Environment variables loaded.');
}
