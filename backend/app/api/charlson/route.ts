/**
 * API Endpoint: /api/charlson
 * Get Charlson Comorbidity Index score for an ICD code
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql, handleDbError } from '../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const system = searchParams.get('system') || 'icd10'; // icd10 or icd9

    if (!code) {
      return NextResponse.json(
        { error: 'Code parameter is required' },
        { status: 400 }
      );
    }

    // Clean the code but keep dots (stored with dots in DB)
    const cleanCode = code.trim().toUpperCase();

    if (system === 'icd10') {
      // Direct query for ICD-10 Charlson
      const results = await sql`
        SELECT code, condition, score
        FROM charlson_icd10
        WHERE code = ${cleanCode}
      `;

      if (results.length === 0) {
        // Try prefix match for family codes
        const prefixResults = await sql`
          SELECT code, condition, score
          FROM charlson_icd10
          WHERE ${cleanCode} LIKE code || '%'
          ORDER BY LENGTH(code) DESC
          LIMIT 1
        `;

        if (prefixResults.length === 0) {
          return NextResponse.json(
            {
              error: 'No Charlson score found for this ICD-10 code',
              code: cleanCode
            },
            { status: 404 }
          );
        }

        // Get code description
        const codeInfo = await sql`
          SELECT description FROM icd10_codes WHERE code = ${cleanCode}
        `;

        return NextResponse.json({
          code: cleanCode,
          system: 'ICD-10-CM',
          codeDescription: codeInfo.length > 0 ? codeInfo[0].description : null,
          condition: prefixResults[0].condition,
          score: prefixResults[0].score,
          matchType: 'prefix',
          matchedCode: prefixResults[0].code
        });
      }

      // Get code description
      const codeInfo = await sql`
        SELECT description FROM icd10_codes WHERE code = ${cleanCode}
      `;

      return NextResponse.json({
        code: cleanCode,
        system: 'ICD-10-CM',
        codeDescription: codeInfo.length > 0 ? codeInfo[0].description : null,
        condition: results[0].condition,
        score: results[0].score,
        matchType: 'exact'
      });

    } else if (system === 'icd9') {
      // Direct query for ICD-9 Charlson
      // Try exact match first (as provided)
      let results = await sql`
        SELECT code, condition, score
        FROM charlson_icd9
        WHERE code = ${cleanCode}
      `;

      // If not found, try without dots (if input had dots) or with dots (if input didn't)
      if (results.length === 0) {
        const cleanCodeNoDots = cleanCode.replace(/\./g, '');

        // Try finding it by stripping dots from DB column too, or just checking the alternate format
        // Since we don't know exactly how it's stored for every code, we check both
        results = await sql`
          SELECT code, condition, score
          FROM charlson_icd9
          WHERE replace(code, '.', '') = ${cleanCodeNoDots}
        `;
      }

      if (results.length === 0) {
        // Try prefix match for family codes
        // For prefix matching, we should probably use the no-dot version for comparison
        const cleanCodeNoDots = cleanCode.replace(/\./g, '');

        const prefixResults = await sql`
          SELECT code, condition, score
          FROM charlson_icd9
          WHERE ${cleanCodeNoDots} LIKE replace(code, '.', '') || '%'
          ORDER BY LENGTH(code) DESC
          LIMIT 1
        `;

        if (prefixResults.length === 0) {
          return NextResponse.json(
            {
              error: 'No Charlson score found for this ICD-9 code',
              code: cleanCode
            },
            { status: 404 }
          );
        }

        return NextResponse.json({
          code: prefixResults[0].code.includes('.') ? prefixResults[0].code : formatICD9(prefixResults[0].code),
          system: 'ICD-9-CM',
          condition: prefixResults[0].condition,
          score: prefixResults[0].score,
          matchType: 'prefix',
          matchedCode: prefixResults[0].code
        });
      }

      return NextResponse.json({
        code: results[0].code.includes('.') ? results[0].code : formatICD9(results[0].code),
        system: 'ICD-9-CM',
        condition: results[0].condition,
        score: results[0].score,
        matchType: 'exact'
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid system parameter. Use icd10 or icd9' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Charlson error:', error);
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
