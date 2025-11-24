
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function createTestUser() {
    const { sql } = await import('../lib/db');

    const email = 'marctomas04@gmail.com';
    const password = 'rAxryJJNU85sqY6';
    const name = 'Marc Tomas';

    try {
        // Check if user exists
        const existingUsers = await sql`SELECT id FROM users WHERE email = ${email}`;

        if (existingUsers.length > 0) {
            console.log('User already exists. Updating password...');
            const passwordHash = await bcrypt.hash(password, 10);
            await sql`
        UPDATE users 
        SET password_hash = ${passwordHash} 
        WHERE email = ${email}
      `;
            console.log('Password updated successfully.');
        } else {
            console.log('Creating new user...');
            const passwordHash = await bcrypt.hash(password, 10);
            await sql`
        INSERT INTO users (email, password_hash, name)
        VALUES (${email}, ${passwordHash}, ${name})
      `;
            console.log('User created successfully.');
        }

        console.log(`Credentials: ${email} / ${password}`);

    } catch (e) {
        console.error('Error creating user:', e);
    }
}

createTestUser();
