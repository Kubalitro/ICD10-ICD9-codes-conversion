import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function createBatchTable() {
    try {
        // Dynamic import to ensure env vars are loaded first
        const { sql } = await import('../lib/db');

        console.log('Creating batch_jobs table...');

        await sql`
      CREATE TABLE IF NOT EXISTS batch_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
        original_filename TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP WITH TIME ZONE,
        results JSONB
      )
    `;

        console.log('✅ batch_jobs table created successfully.');
    } catch (error) {
        console.error('Error creating table:', error);
    }
}

createBatchTable();
