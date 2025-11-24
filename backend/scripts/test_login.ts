
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

console.log('--- DEBUG INFO ---');
const dbUrl = process.env.DATABASE_URL;
console.log('DATABASE_URL defined:', !!dbUrl);
if (dbUrl) {
    console.log('Length:', dbUrl.length);
    console.log('First 20 chars:', dbUrl.substring(0, 20));
    console.log('Last 20 chars:', dbUrl.substring(dbUrl.length - 20));
    console.log('Contains newlines:', dbUrl.includes('\n') || dbUrl.includes('\r'));
    console.log('Contains spaces:', dbUrl.includes(' '));
    console.log('Full URL (masked):', dbUrl.replace(/:[^:@]+@/, ':***@'));
}
console.log('------------------');

async function testLogin() {
    const { sql } = await import('../lib/db');
    const email = 'marctomas04@gmail.com';
    const password = 'rAxryJJNU85sqY6';

    console.log(`Testing login for ${email}...`);

    try {
        const users = await sql`SELECT * FROM users WHERE email = ${email}`;

        if (users.length === 0) {
            console.log('❌ User not found in database.');
            return;
        }

        const user = users[0];
        console.log('User found. Verifying password...');

        const isValid = await bcrypt.compare(password, user.password_hash);

        if (isValid) {
            console.log('✅ Login successful! Password matches.');
        } else {
            console.log('❌ Invalid password.');
            console.log('Hash in DB:', user.password_hash);
        }

    } catch (error) {
        console.error('❌ Database error:', error);
    }
}

testLogin();
