/**
 * API Endpoint: /api/convert
 * Convert between ICD-10 and ICD-9 codes
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql, handleDbError } from '../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const from = searchParams.get('from'); // icd10 or icd9
    const to = searchParams.get('to'); // icd9 or icd10

    if (!code || !from || !to) {
      return NextResponse.json(
        { error: 'Required parameters: code, from, to' },
        { status: 400 }
      );
    }

    // Remove dots from ICD codes (stored without dots in DB)
    const cleanCode = code.trim().toUpperCase().replace(/\./g, '');

    // ICD-10 to ICD-9
    if (from === 'icd10' && to === 'icd9') {
      const conversions = await sql`
        SELECT 
          m.icd10_code as source_code,
          ic.description as source_description,
          m.icd9_code as target_code,
          m.approximate,
          m.no_map,
          m.combination,
          m.scenario,
          m.choice_list
        FROM icd10_to_icd9_mapping m
        JOIN icd10_codes ic ON m.icd10_code = ic.code
        WHERE m.icd10_code = ${cleanCode}
        ORDER BY m.approximate ASC, m.icd9_code ASC
      `;

      if (conversions.length === 0) {
        return NextResponse.json(
          { error: 'No conversions found for this code', code: cleanCode },
          { status: 404 }
        );
      }

      return NextResponse.json({
        sourceCode: cleanCode,
        sourceSystem: 'ICD-10-CM',
        sourceDescription: conversions[0].source_description,
        targetSystem: 'ICD-9-CM',
        conversions: conversions.map(c => ({
          targetCode: c.target_code,
          approximate: c.approximate,
          noMap: c.no_map,
          combination: c.combination,
          scenario: c.scenario,
          choiceList: c.choice_list
        })),
        totalCount: conversions.length
      });
    }

    // ICD-9 to ICD-10
    if (from === 'icd9' && to === 'icd10') {
      const conversions = await sql`
        SELECT 
          m.icd9_code as source_code,
          m.icd10_code as target_code,
          ic.description as target_description,
          m.approximate,
          m.no_map,
          m.combination,
          m.scenario,
          m.choice_list
        FROM icd9_to_icd10_mapping m
        JOIN icd10_codes ic ON m.icd10_code = ic.code
        WHERE m.icd9_code = ${cleanCode}
        ORDER BY m.approximate ASC, m.icd10_code ASC
      `;

      if (conversions.length === 0) {
        return NextResponse.json(
          { error: 'No conversions found for this code', code: cleanCode },
          { status: 404 }
        );
      }

      return NextResponse.json({
        sourceCode: cleanCode,
        sourceSystem: 'ICD-9-CM',
        targetSystem: 'ICD-10-CM',
        conversions: conversions.map(c => ({
          targetCode: c.target_code,
          targetDescription: c.target_description,
          approximate: c.approximate,
          noMap: c.no_map,
          combination: c.combination,
          scenario: c.scenario,
          choiceList: c.choice_list
        })),
        totalCount: conversions.length
      });
    }

    return NextResponse.json(
      { error: 'Invalid conversion direction. Use from=icd10&to=icd9 or from=icd9&to=icd10' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Conversion error:', error);
    return NextResponse.json(
      handleDbError(error),
      { status: 500 }
    );
  }
}
