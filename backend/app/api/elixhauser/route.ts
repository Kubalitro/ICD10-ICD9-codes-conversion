/**
 * API Endpoint: /api/elixhauser
 * Get Elixhauser comorbidity classifications for an ICD-10 code
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql, handleDbError } from '../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Code parameter is required' },
        { status: 400 }
      );
    }

    // Remove dots from ICD codes (stored without dots in DB)
    const cleanCode = code.trim().toUpperCase().replace(/\./g, '');

    // Get Elixhauser classifications
    const results = await sql`
      SELECT 
        em.icd10_code,
        ic.description as code_description,
        ec.code as category_code,
        ec.name as category_name,
        ec.description as category_description
      FROM elixhauser_mappings em
      JOIN elixhauser_categories ec ON em.category_code = ec.code
      JOIN icd10_codes ic ON em.icd10_code = ic.code
      WHERE em.icd10_code = ${cleanCode}
      ORDER BY ec.name ASC
    `;

    if (results.length === 0) {
      return NextResponse.json(
        { 
          error: 'No Elixhauser classifications found for this code',
          code: cleanCode 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      code: cleanCode,
      codeDescription: results[0].code_description,
      categories: results.map(r => ({
        code: r.category_code,
        name: r.category_name,
        description: r.category_description
      })),
      totalCategories: results.length
    });

  } catch (error) {
    console.error('Elixhauser error:', error);
    return NextResponse.json(
      handleDbError(error),
      { status: 500 }
    );
  }
}
