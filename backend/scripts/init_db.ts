import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

async function initDb() {
    try {
        const { sql } = await import('../lib/db');

        const schemaPath = path.join(process.cwd(), 'scripts', 'create_user_tables.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('Executing schema...');

        // Split by semicolon to execute statements individually if needed, 
        // but neon might handle multiple statements. 
        // Let's try executing the whole thing first.
        // Note: neon driver might not support multiple statements in one call depending on config.
        // It's safer to split.

        const statements = schema
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements) {
            console.log(`Executing: ${statement.substring(0, 50)}...`);
            await sql(statement);
        }

        console.log('Database initialized successfully.');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

initDb();
