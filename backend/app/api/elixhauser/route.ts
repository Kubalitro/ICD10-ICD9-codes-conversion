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

    const system = searchParams.get('system') || 'icd10'; // icd10 or icd9

    // Remove dots from ICD codes (stored without dots in DB for ICD-10, usually)
    const cleanCode = code.trim().toUpperCase().replace(/\./g, '');

    let results;

    if (system === 'icd10') {
      // Get Elixhauser classifications for ICD-10
      results = await sql`
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
    } else if (system === 'icd9') {
      // Get Elixhauser classifications for ICD-9
      // Note: We stored them without dots in the setup script
      results = await sql`
        SELECT 
          code as icd9_code,
          description as code_description,
          comorbidities
        FROM elixhauser_icd9
        WHERE code = ${cleanCode}
      `;


      // Transform ICD-9 results to match response format
      if (results.length > 0) {
        const r = results[0];
        // We need to map comorbidity codes to names/descriptions if possible
        // For now, we'll just return the codes as categories
        const categories = r.comorbidities.map((c: string) => ({
          code: c,
          name: c,
          description: c
        }));

        // Always ensure dots for ICD-9 display
        const displayCode = r.icd9_code.includes('.') ? r.icd9_code : formatICD9(r.icd9_code);

        return NextResponse.json({
          code: displayCode,
          codeDescription: r.code_description,
          categories: categories,
          totalCategories: categories.length
        });
      }

    } else {
      return NextResponse.json(
        { error: 'Invalid system parameter. Use icd10 or icd9' },
        { status: 400 }
      );
    }

    if (!results || results.length === 0) {
      return NextResponse.json(
        {
          error: `No Elixhauser classifications found for this ${system} code`,
          code: cleanCode
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      code: cleanCode,
      codeDescription: results[0].code_description,
      categories: results.map((r: any) => ({
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
