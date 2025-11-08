/**
 * API Endpoint: /api/search
 * Search for ICD codes (ICD-10 or ICD-9)
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql, handleDbError } from '../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const type = searchParams.get('type') || 'auto'; // auto, icd10, icd9
    const fuzzy = searchParams.get('fuzzy') === 'true';

    if (!code) {
      return NextResponse.json(
        { error: 'Code parameter is required' },
        { status: 400 }
      );
    }

    // Remove dots from ICD codes (stored without dots in DB)
    const cleanCode = code.trim().toUpperCase().replace(/\./g, '');
    let result: any = null;

    // Search ICD-10
    if (type === 'auto' || type === 'icd10') {
      if (fuzzy) {
        // Fuzzy search by description
        const icd10Results = await sql`
          SELECT code, description
          FROM icd10_codes
          WHERE description ILIKE ${'%' + cleanCode + '%'}
          LIMIT 20
        `;
        
        if (icd10Results.length > 0) {
          return NextResponse.json({
            system: 'ICD-10-CM',
            results: icd10Results,
            count: icd10Results.length
          });
        }
      } else {
        // Exact code search
        const icd10Result = await sql`
          SELECT code, description
          FROM icd10_codes
          WHERE code = ${cleanCode}
        `;

        if (icd10Result.length > 0) {
          result = {
            code: icd10Result[0].code,
            system: 'ICD-10-CM',
            description: icd10Result[0].description,
            isFamily: false
          };
          
          return NextResponse.json(result);
        }

        // Check if it's a family code (prefix)
        const familyResults = await sql`
          SELECT code, description
          FROM icd10_codes
          WHERE code LIKE ${cleanCode + '%'}
          LIMIT 50
        `;

        if (familyResults.length > 0) {
          return NextResponse.json({
            code: cleanCode,
            system: 'ICD-10-CM',
            description: `Family code - ${familyResults.length} codes found`,
            isFamily: true,
            familyCodes: familyResults.slice(0, 10),
            totalCount: familyResults.length
          });
        }
      }
    }

    // Search ICD-9
    if (type === 'auto' || type === 'icd9') {
      const icd9Result = await sql`
        SELECT code
        FROM icd9_codes
        WHERE code = ${cleanCode}
      `;

      if (icd9Result.length > 0) {
        result = {
          code: icd9Result[0].code,
          system: 'ICD-9-CM',
          description: 'ICD-9 code (no description available)',
          isFamily: false
        };
        
        return NextResponse.json(result);
      }

      // Check family for ICD-9
      const familyResults = await sql`
        SELECT code
        FROM icd9_codes
        WHERE code LIKE ${cleanCode + '%'}
        LIMIT 50
      `;

      if (familyResults.length > 0) {
        return NextResponse.json({
          code: cleanCode,
          system: 'ICD-9-CM',
          description: `Family code - ${familyResults.length} codes found`,
          isFamily: true,
          familyCodes: familyResults.slice(0, 10),
          totalCount: familyResults.length
        });
      }
    }

    // Not found
    return NextResponse.json(
      { error: 'Code not found', searchedCode: cleanCode },
      { status: 404 }
    );

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      handleDbError(error),
      { status: 500 }
    );
  }
}
