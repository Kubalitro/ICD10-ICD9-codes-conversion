import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    try {
        // Normalize code: remove dots (DB stores codes without dots, e.g., A0104)
        const cleanCode = code.trim().toUpperCase().replace(/\./g, '');

        const results = await sql`
      SELECT 
        icd10_code,
        description,
        hcc_category,
        hcc_description,
        raf_score
      FROM hcc_mappings
      WHERE icd10_code = ${cleanCode}
    `;

        if (results.length === 0) {
            return NextResponse.json({
                code: cleanCode,
                hcc: null,
                message: 'No HCC mapping found for this code'
            });
        }

        return NextResponse.json({
            code: results[0].icd10_code,
            description: results[0].description,
            hcc: {
                category: results[0].hcc_category,
                description: results[0].hcc_description,
                score: results[0].raf_score
            }
        });

    } catch (error) {
        console.error('Error fetching HCC data:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
