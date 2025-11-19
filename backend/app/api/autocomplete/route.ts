/**
 * API Endpoint: /api/autocomplete
 * Autocomplete search for ICD codes by code or description
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql, handleDbError } from '../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const system = searchParams.get('system') || 'icd10'; // icd10 or icd9
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.length < 2) {
      return NextResponse.json({
        results: [],
        message: 'Query must be at least 2 characters'
      });
    }

    const cleanQuery = query.trim().toUpperCase().replace(/\./g, '');
    const results: any[] = [];

    if (system === 'icd10') {
      // Search by code prefix
      const codeResults = await sql`
        SELECT code, description
        FROM icd10_codes
        WHERE code LIKE ${cleanQuery + '%'}
        ORDER BY code ASC
        LIMIT ${Math.min(limit, 20)}
      `;

      // Search by description
      const excludeCodes = codeResults.map(r => r.code);
      const descResults = excludeCodes.length > 0 
        ? await sql`
            SELECT code, description
            FROM icd10_codes
            WHERE description ILIKE ${'%' + cleanQuery + '%'}
            AND code != ALL(${excludeCodes})
            ORDER BY 
              CASE 
                WHEN description ILIKE ${cleanQuery + '%'} THEN 1
                WHEN description ILIKE ${'% ' + cleanQuery + '%'} THEN 2
                ELSE 3
              END,
              code ASC
            LIMIT ${Math.max(0, Math.min(limit, 20) - codeResults.length)}
          `
        : await sql`
            SELECT code, description
            FROM icd10_codes
            WHERE description ILIKE ${'%' + cleanQuery + '%'}
            ORDER BY 
              CASE 
                WHEN description ILIKE ${cleanQuery + '%'} THEN 1
                WHEN description ILIKE ${'% ' + cleanQuery + '%'} THEN 2
                ELSE 3
              END,
              code ASC
            LIMIT ${Math.min(limit, 20)}
          `;

      results.push(...codeResults.map(r => ({
        code: r.code,
        description: r.description,
        system: 'ICD-10-CM',
        matchType: 'code'
      })));

      results.push(...descResults.map(r => ({
        code: r.code,
        description: r.description,
        system: 'ICD-10-CM',
        matchType: 'description'
      })));

    } else if (system === 'icd9') {
      // For ICD-9, we only have codes (no descriptions in the DB)
      const codeResults = await sql`
        SELECT code
        FROM icd9_codes
        WHERE code LIKE ${cleanQuery + '%'}
        ORDER BY code ASC
        LIMIT ${Math.min(limit, 20)}
      `;

      results.push(...codeResults.map(r => ({
        code: r.code,
        description: 'ICD-9 code',
        system: 'ICD-9-CM',
        matchType: 'code'
      })));
    }

    return NextResponse.json({
      query: query,
      results: results,
      count: results.length
    });

  } catch (error) {
    console.error('Autocomplete error:', error);
    return NextResponse.json(
      handleDbError(error),
      { status: 500 }
    );
  }
}
