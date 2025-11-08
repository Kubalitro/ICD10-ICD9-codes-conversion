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

    // Remove dots from ICD codes (stored without dots in DB)
    const cleanCode = code.trim().toUpperCase().replace(/\./g, '');

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
      const results = await sql`
        SELECT code, condition, score
        FROM charlson_icd9
        WHERE code = ${cleanCode}
      `;

      if (results.length === 0) {
        // Try prefix match for family codes
        const prefixResults = await sql`
          SELECT code, condition, score
          FROM charlson_icd9
          WHERE ${cleanCode} LIKE code || '%'
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
          code: cleanCode,
          system: 'ICD-9-CM',
          condition: prefixResults[0].condition,
          score: prefixResults[0].score,
          matchType: 'prefix',
          matchedCode: prefixResults[0].code
        });
      }

      return NextResponse.json({
        code: cleanCode,
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
