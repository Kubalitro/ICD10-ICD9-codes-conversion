import 'dotenv/config'
import { sql } from './lib/db'

async function testConnection() {
    try {
        console.log('Testing database connection...')

        // Test 1: Check current schema
        const schemaResult = await sql`SELECT current_schema()`
        console.log('Current schema:', schemaResult)

        // Test 2: List all tables
        const tables = await sql`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name = 'users'
    `
        console.log('Users tables found:', tables)

        // Test 3: Try to query users table
        try {
            const users = await sql`SELECT COUNT(*) FROM users`
            console.log('Users count (no schema):', users)
        } catch (e: any) {
            console.log('Error querying users (no schema):', e.message)
        }

        // Test 4: Try with public schema
        try {
            const usersPublic = await sql`SELECT COUNT(*) FROM public.users`
            console.log('Users count (public schema):', usersPublic)
        } catch (e: any) {
            console.log('Error querying public.users:', e.message)
        }

    } catch (error) {
        console.error('Test failed:', error)
    }
}

testConnection()
