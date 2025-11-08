/**
 * Test endpoint to verify database connection and data
 */

import { NextResponse } from 'next/server';
import { sql } from '../../../lib/db';

export async function GET() {
  try {
    // Test connection
    const result = await sql`SELECT current_database(), current_user`;
    
    // Count ICD-10 codes
    const icd10Count = await sql`SELECT COUNT(*) as count FROM icd10_codes`;
    
    // Count ICD-9 codes
    const icd9Count = await sql`SELECT COUNT(*) as count FROM icd9_codes`;
    
    // Get sample ICD-10 codes
    const sampleIcd10 = await sql`SELECT code, description FROM icd10_codes LIMIT 10`;
    
    // Get sample ICD-9 codes
    const sampleIcd9 = await sql`SELECT code FROM icd9_codes LIMIT 10`;

    return NextResponse.json({
      status: 'Connected',
      database: result[0].current_database,
      user: result[0].current_user,
      counts: {
        icd10: parseInt(icd10Count[0].count),
        icd9: parseInt(icd9Count[0].count)
      },
      samples: {
        icd10: sampleIcd10,
        icd9: sampleIcd9
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { 
        error: 'Database error', 
        message: error.message,
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
