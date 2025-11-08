/**
 * API Endpoint: /api/family
 * Get all codes in a family (e.g., E10 returns all Type 1 Diabetes codes)
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql, handleDbError } from '../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const prefix = searchParams.get('prefix');
    const system = searchParams.get('system') || 'icd10'; // icd10 or icd9
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!prefix) {
      return NextResponse.json(
        { error: 'Prefix parameter is required' },
        { status: 400 }
      );
    }

    // Remove dots from ICD codes (stored without dots in DB)
    const cleanPrefix = prefix.trim().toUpperCase().replace(/\./g, '');

    if (system === 'icd10') {
      // Direct query for ICD-10 family codes
      const results = await sql`
        SELECT code, description
        FROM icd10_codes
        WHERE code LIKE ${cleanPrefix + '%'}
        ORDER BY code
        LIMIT ${limit}
      `;

      if (results.length === 0) {
        return NextResponse.json(
          { 
            error: 'No codes found for this prefix',
            prefix: cleanPrefix 
          },
          { status: 404 }
        );
      }

      // Get total count
      const countResult = await sql`
        SELECT COUNT(*) as total
        FROM icd10_codes
        WHERE code LIKE ${cleanPrefix + '%'}
      `;

      return NextResponse.json({
        prefix: cleanPrefix,
        system: 'ICD-10-CM',
        codes: results.map(r => ({
          code: r.code,
          description: r.description
        })),
        count: results.length,
        totalCount: parseInt(countResult[0].total)
      });

    } else if (system === 'icd9') {
      // ICD-9 family search
      const results = await sql`
        SELECT code
        FROM icd9_codes
        WHERE code LIKE ${cleanPrefix + '%'}
        ORDER BY code
        LIMIT ${limit}
      `;

      if (results.length === 0) {
        return NextResponse.json(
          { 
            error: 'No codes found for this prefix',
            prefix: cleanPrefix 
          },
          { status: 404 }
        );
      }

      // Get total count
      const countResult = await sql`
        SELECT COUNT(*) as total
        FROM icd9_codes
        WHERE code LIKE ${cleanPrefix + '%'}
      `;

      return NextResponse.json({
        prefix: cleanPrefix,
        system: 'ICD-9-CM',
        codes: results.map(r => ({
          code: r.code,
          description: 'No description available'
        })),
        count: results.length,
        totalCount: parseInt(countResult[0].total)
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid system parameter. Use icd10 or icd9' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Family error:', error);
    return NextResponse.json(
      handleDbError(error),
      { status: 500 }
    );
  }
}
