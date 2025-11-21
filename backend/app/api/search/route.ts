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

    // Check if user wants family search with .x notation (e.g., I50.x)
    const isFamilySearch = code.includes('.x') || code.endsWith('x');

    // Clean code: remove dots and spaces (database stores codes without formatting)
    let cleanCode = code.trim().toUpperCase().replace(/\./g, '').replace(/\s/g, '');
    if (isFamilySearch) {
      cleanCode = cleanCode.replace(/X$/gi, ''); // Remove trailing X for family search
    }
    let result: any = null;

    // Search ICD-10
    if (type === 'auto' || type === 'icd10') {
      // If user explicitly requested family search with .x notation
      if (isFamilySearch) {
        const familyResults = await sql`
          SELECT code, description
          FROM icd10_codes
          WHERE code LIKE ${cleanCode + '%'}
          ORDER BY code
          LIMIT 100
        `;

        if (familyResults.length > 0) {
          return NextResponse.json({
            code: cleanCode,
            system: 'ICD-10-CM',
            description: `Family code ${code} - ${familyResults.length} codes found`,
            isFamily: true,
            isFamilySearch: true,
            familyCodes: familyResults,
            totalCount: familyResults.length
          });
        }
      }

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
      // For ICD-9, try both with dots and without (database inconsistency)
      const cleanCodeNoDots = cleanCode.replace(/\./g, '');

      // If user explicitly requested family search with .x notation
      if (isFamilySearch) {
        const familyResults = await sql`
          SELECT code
          FROM icd9_codes
          WHERE code LIKE ${cleanCodeNoDots + '%'}
          ORDER BY code
          LIMIT 100
        `;

        if (familyResults.length > 0) {
          return NextResponse.json({
            code: cleanCodeNoDots,
            system: 'ICD-9-CM',
            description: `Family code ${code} - ${familyResults.length} codes found`,
            isFamily: true,
            isFamilySearch: true,
            familyCodes: familyResults,
            totalCount: familyResults.length
          });
        }
      }

      // Try exact match with dots first (for Charlson compatibility)
      const icd9ResultWithDots = await sql`
        SELECT code
        FROM icd9_codes
        WHERE code = ${cleanCode}
      `;

      if (icd9ResultWithDots.length > 0) {
        result = {
          code: icd9ResultWithDots[0].code.includes('.') ? icd9ResultWithDots[0].code : formatICD9(icd9ResultWithDots[0].code),
          system: 'ICD-9-CM',
          description: 'ICD-9 code (no description available)',
          isFamily: false
        };

        return NextResponse.json(result);
      }

      // Try without dots
      const icd9Result = await sql`
        SELECT code
        FROM icd9_codes
        WHERE code = ${cleanCodeNoDots}
      `;

      if (icd9Result.length > 0) {
        result = {
          code: formatICD9(icd9Result[0].code),
          system: 'ICD-9-CM',
          description: 'ICD-9 code (no description available)',
          isFamily: false
        };

        return NextResponse.json(result);
      }

      // Check if it exists in Charlson table (with dot) - treat as specific code if found
      const charlsonResult = await sql`
        SELECT code, condition
        FROM charlson_icd9
        WHERE code = ${cleanCode} OR replace(code, '.', '') = ${cleanCodeNoDots}
      `;

      if (charlsonResult.length > 0) {
        result = {
          code: charlsonResult[0].code.includes('.') ? charlsonResult[0].code : formatICD9(charlsonResult[0].code),
          system: 'ICD-9-CM',
          description: `${charlsonResult[0].condition} (Charlson condition)`,
          isFamily: false
        };

        return NextResponse.json(result);
      }

      // Check family for ICD-9 (without dots for prefix matching)
      const familyResults = await sql`
        SELECT code
        FROM icd9_codes
        WHERE code LIKE ${cleanCodeNoDots + '%'}
        LIMIT 50
      `;

      if (familyResults.length > 0) {
        return NextResponse.json({
          code: formatICD9(cleanCodeNoDots),
          system: 'ICD-9-CM',
          description: `Family code - ${familyResults.length} codes found`,
          isFamily: true,
          familyCodes: familyResults.slice(0, 10).map((r: any) => ({ ...r, code: formatICD9(r.code) })),
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

function formatICD9(code: string): string {
  if (code.includes('.')) return code;

  // Handle E-codes (E + 3 digits + optional digit)
  if (code.startsWith('E')) {
    if (code.length > 4) {
      return `${code.slice(0, 4)}.${code.slice(4)}`;
    }
    return code;
  }

  if (code.length <= 3) return code;
  return `${code.slice(0, 3)}.${code.slice(3)}`;
}
