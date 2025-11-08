/**
 * API Endpoint: /api/charlson/list
 * List all Charlson conditions available
 */

import { NextResponse } from 'next/server';
import { sql, handleDbError } from '../../../../lib/db';

export async function GET() {
  try {
    // Get all unique conditions from ICD-10 Charlson
    const icd10Conditions = await sql`
      SELECT DISTINCT condition, score
      FROM charlson_icd10
      ORDER BY score DESC, condition ASC
    `;

    // Get all unique conditions from ICD-9 Charlson
    const icd9Conditions = await sql`
      SELECT DISTINCT condition, score
      FROM charlson_icd9
      ORDER BY score DESC, condition ASC
    `;

    // Get sample codes for each condition
    const sampleCodes = await sql`
      SELECT condition, code, score
      FROM charlson_icd10
      ORDER BY condition, code
    `;

    // Group by condition
    const conditionsMap: any = {};
    for (const row of sampleCodes) {
      if (!conditionsMap[row.condition]) {
        conditionsMap[row.condition] = {
          condition: row.condition,
          score: row.score,
          sampleCodes: []
        };
      }
      if (conditionsMap[row.condition].sampleCodes.length < 3) {
        conditionsMap[row.condition].sampleCodes.push(row.code);
      }
    }

    return NextResponse.json({
      totalConditions: icd10Conditions.length,
      icd10Count: icd10Conditions.length,
      icd9Count: icd9Conditions.length,
      conditions: Object.values(conditionsMap),
      icd10Conditions: icd10Conditions,
      icd9Conditions: icd9Conditions
    });

  } catch (error) {
    console.error('Charlson list error:', error);
    return NextResponse.json(
      handleDbError(error),
      { status: 500 }
    );
  }
}
