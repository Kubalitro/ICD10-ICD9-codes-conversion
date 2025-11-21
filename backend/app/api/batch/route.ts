/**
 * API Endpoint: /api/batch
 * Process multiple ICD codes and return conversions with aggregated comorbidity scores
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql, handleDbError } from '../../../lib/db';

interface CodeInput {
  code: string;
  system: 'icd10' | 'icd9';
}

interface ConversionResult {
  sourceCode: string;
  sourceSystem: string;
  sourceDescription?: string;
  targetCodes: string[];
  targetSystem: string;
  foundSourceCodes?: string[];
  conversions: any[];
  error?: string;
}

interface CharlsonCondition {
  condition: string;
  score: number;
  codes: string[];
}

interface ElixhauserCategory {
  code: string;
  name: string;
  description: string;
  icdCodes: string[];
}

interface BatchResult {
  inputCodes: string[];
  conversions: ConversionResult[];
  aggregatedCharlson: {
    totalScore: number;
    conditions: CharlsonCondition[];
  };
  aggregatedElixhauser: {
    categories: ElixhauserCategory[];
    totalCategories: number;
  };
  summary: {
    totalInputCodes: number;
    successfulConversions: number;
    failedConversions: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { codes, system } = body;

    if (!codes || !Array.isArray(codes) || codes.length === 0) {
      return NextResponse.json(
        { error: 'Codes array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (!system || !['icd10', 'icd9'].includes(system)) {
      return NextResponse.json(
        { error: 'System must be either "icd10" or "icd9"' },
        { status: 400 }
      );
    }

    // Clean and normalize codes
    const cleanCodes = codes.map(code =>
      String(code).trim().toUpperCase().replace(/\./g, '')
    );

    const result: BatchResult = {
      inputCodes: cleanCodes,
      conversions: [],
      aggregatedCharlson: {
        totalScore: 0,
        conditions: []
      },
      aggregatedElixhauser: {
        categories: [],
        totalCategories: 0
      },
      summary: {
        totalInputCodes: cleanCodes.length,
        successfulConversions: 0,
        failedConversions: 0
      }
    };

    const allIcd10Codes = new Set<string>();
    const allIcd9Codes = new Set<string>();

    // Process each code
    for (const cleanCode of cleanCodes) {
      if (system === 'icd10') {
        allIcd10Codes.add(cleanCode);

        // Convert ICD-10 to ICD-9
        let conversions = await sql`
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

        // If no exact match, try prefix/family search
        if (conversions.length === 0) {
          conversions = await sql`
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
            WHERE m.icd10_code LIKE ${cleanCode + '%'}
            ORDER BY m.icd10_code ASC, m.approximate ASC, m.icd9_code ASC
            LIMIT 100
          `;

          // Add all found family codes to the set
          if (conversions.length > 0) {
            conversions.forEach(c => allIcd10Codes.add(c.source_code));
          }
        }

        if (conversions.length === 0) {
          result.conversions.push({
            sourceCode: cleanCode,
            sourceSystem: 'ICD-10-CM',
            targetSystem: 'ICD-9-CM',
            targetCodes: [],
            conversions: [],
            error: 'No conversions found'
          });
          result.summary.failedConversions++;
        } else {
          const targetCodes = conversions.map(c => c.target_code);
          targetCodes.forEach(code => allIcd9Codes.add(code));

          // Get unique source codes found (for family search)
          const uniqueSourceCodes = [...new Set(conversions.map(c => c.source_code))];

          result.conversions.push({
            sourceCode: cleanCode,
            sourceSystem: 'ICD-10-CM',
            sourceDescription: conversions[0].source_description,
            targetSystem: 'ICD-9-CM',
            targetCodes: targetCodes,
            foundSourceCodes: uniqueSourceCodes, // C�digos espec�ficos encontrados
            conversions: conversions.map(c => ({
              sourceCode: c.source_code, // Incluir c�digo fuente espec�fico
              targetCode: c.target_code,
              approximate: c.approximate,
              noMap: c.no_map,
              combination: c.combination,
              scenario: c.scenario,
              choiceList: c.choice_list
            }))
          });
          result.summary.successfulConversions++;
        }

      } else if (system === 'icd9') {
        allIcd9Codes.add(cleanCode);

        // Convert ICD-9 to ICD-10
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
          result.conversions.push({
            sourceCode: cleanCode,
            sourceSystem: 'ICD-9-CM',
            targetSystem: 'ICD-10-CM',
            targetCodes: [],
            conversions: [],
            error: 'No conversions found'
          });
          result.summary.failedConversions++;
        } else {
          const targetCodes = conversions.map(c => c.target_code);
          targetCodes.forEach(code => allIcd10Codes.add(code));

          result.conversions.push({
            sourceCode: cleanCode,
            sourceSystem: 'ICD-9-CM',
            targetSystem: 'ICD-10-CM',
            targetCodes: targetCodes,
            conversions: conversions.map(c => ({
              targetCode: c.target_code,
              targetDescription: c.target_description,
              approximate: c.approximate,
              noMap: c.no_map,
              combination: c.combination,
              scenario: c.scenario,
              choiceList: c.choice_list
            }))
          });
          result.summary.successfulConversions++;
        }
      }
    }

    // Calculate aggregated Charlson score
    const charlsonMap = new Map<string, CharlsonCondition>();

    // Check ICD-10 codes for Charlson
    if (allIcd10Codes.size > 0) {
      for (const code of allIcd10Codes) {
        const charlsonResults = await sql`
          SELECT code, condition, score
          FROM charlson_icd10
          WHERE code = ${code}
        `;

        if (charlsonResults.length === 0) {
          // Try prefix match
          const prefixResults = await sql`
            SELECT code, condition, score
            FROM charlson_icd10
            WHERE ${code} LIKE code || '%'
            ORDER BY LENGTH(code) DESC
            LIMIT 1
          `;

          if (prefixResults.length > 0) {
            const condition = prefixResults[0].condition;
            if (!charlsonMap.has(condition) || charlsonMap.get(condition)!.score < prefixResults[0].score) {
              charlsonMap.set(condition, {
                condition: condition,
                score: prefixResults[0].score,
                codes: [code]
              });
            } else if (charlsonMap.get(condition)!.score === prefixResults[0].score) {
              charlsonMap.get(condition)!.codes.push(code);
            }
          }
        } else {
          const condition = charlsonResults[0].condition;
          if (!charlsonMap.has(condition) || charlsonMap.get(condition)!.score < charlsonResults[0].score) {
            charlsonMap.set(condition, {
              condition: condition,
              score: charlsonResults[0].score,
              codes: [code]
            });
          } else if (charlsonMap.get(condition)!.score === charlsonResults[0].score) {
            charlsonMap.get(condition)!.codes.push(code);
          }
        }
      }
    }

    // Check ICD-9 codes for Charlson (if not already found in ICD-10)
    if (allIcd9Codes.size > 0) {
      for (const code of allIcd9Codes) {
        const charlsonResults = await sql`
          SELECT code, condition, score
          FROM charlson_icd9
          WHERE code = ${code}
        `;

        if (charlsonResults.length === 0) {
          // Try prefix match
          const prefixResults = await sql`
            SELECT code, condition, score
            FROM charlson_icd9
            WHERE ${code} LIKE code || '%'
            ORDER BY LENGTH(code) DESC
            LIMIT 1
          `;

          if (prefixResults.length > 0) {
            const condition = prefixResults[0].condition;
            if (!charlsonMap.has(condition) || charlsonMap.get(condition)!.score < prefixResults[0].score) {
              charlsonMap.set(condition, {
                condition: condition,
                score: prefixResults[0].score,
                codes: [code]
              });
            } else if (charlsonMap.get(condition)!.score === prefixResults[0].score) {
              charlsonMap.get(condition)!.codes.push(code);
            }
          }
        } else {
          const condition = charlsonResults[0].condition;
          if (!charlsonMap.has(condition) || charlsonMap.get(condition)!.score < charlsonResults[0].score) {
            charlsonMap.set(condition, {
              condition: condition,
              score: charlsonResults[0].score,
              codes: [code]
            });
          } else if (charlsonMap.get(condition)!.score === charlsonResults[0].score) {
            charlsonMap.get(condition)!.codes.push(code);
          }
        }
      }
    }

    // Finalize Charlson results
    result.aggregatedCharlson.conditions = Array.from(charlsonMap.values())
      .sort((a, b) => b.score - a.score);
    result.aggregatedCharlson.totalScore = result.aggregatedCharlson.conditions
      .reduce((sum, cond) => sum + cond.score, 0);

    // Calculate aggregated Elixhauser categories (only for ICD-10 codes)
    const elixhauserMap = new Map<string, ElixhauserCategory>();

    if (allIcd10Codes.size > 0) {
      for (const code of allIcd10Codes) {
        const elixhauserResults = await sql`
          SELECT 
            em.icd10_code,
            ec.code as category_code,
            ec.name as category_name,
            ec.description as category_description
          FROM elixhauser_mappings em
          JOIN elixhauser_categories ec ON em.category_code = ec.code
          WHERE em.icd10_code = ${code}
        `;

        for (const row of elixhauserResults) {
          const categoryCode = row.category_code;
          if (!elixhauserMap.has(categoryCode)) {
            elixhauserMap.set(categoryCode, {
              code: categoryCode,
              name: row.category_name,
              description: row.category_description,
              icdCodes: [code]
            });
          } else {
            elixhauserMap.get(categoryCode)!.icdCodes.push(code);
          }
        }
      }
    }

    // Finalize Elixhauser results
    result.aggregatedElixhauser.categories = Array.from(elixhauserMap.values())
      .sort((a, b) => a.name.localeCompare(b.name));
    result.aggregatedElixhauser.totalCategories = result.aggregatedElixhauser.categories.length;

    // Calculate HCC scores (only for ICD-10 codes)
    const hccMap = new Map<string, { code: string, category: string, description: string }>();

    if (allIcd10Codes.size > 0) {
      for (const code of allIcd10Codes) {
        const hccResults = await sql`
          SELECT 
            icd10_code,
            hcc_category,
            hcc_description,
            description
          FROM hcc_mappings
          WHERE icd10_code = ${code}
        `;

        if (hccResults.length > 0) {
          const hccData = hccResults[0];
          // Only store one HCC per code (in case of duplicates)
          if (!hccMap.has(code)) {
            hccMap.set(code, {
              code: code,
              category: hccData.hcc_category,
              description: hccData.hcc_description || hccData.description || ''
            });
          }
        }
      }
    }

    // Add per-code scores to conversions
    result.conversions = result.conversions.map(conversion => {
      const sourceCode = conversion.sourceCode;
      const isIcd10 = conversion.sourceSystem === 'ICD-10-CM';

      // Get scores for this specific code
      let charlsonScore = 0;
      let charlsonCondition = '';
      let elixhauserCategories: string[] = [];
      let hccCategory = '';

      // Find Charlson for this code
      result.aggregatedCharlson.conditions.forEach(cond => {
        if (cond.codes.includes(sourceCode)) {
          charlsonScore = Math.max(charlsonScore, cond.score);
          charlsonCondition = cond.condition;
        }
      });

      // Find Elixhauser for this code
      result.aggregatedElixhauser.categories.forEach(cat => {
        if (cat.icdCodes.includes(sourceCode)) {
          elixhauserCategories.push(cat.name);
        }
      });

      // Find HCC for this code (ICD-10 only)
      if (isIcd10 && hccMap.has(sourceCode)) {
        hccCategory = hccMap.get(sourceCode)!.category;
      }

      return {
        ...conversion,
        scores: {
          charlson: charlsonScore > 0 ? { score: charlsonScore, condition: charlsonCondition } : null,
          elixhauser: elixhauserCategories.length > 0 ? { count: elixhauserCategories.length, categories: elixhauserCategories } : null,
          hcc: hccCategory ? { category: hccCategory } : null
        }
      };
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Batch conversion error:', error);
    return NextResponse.json(
      handleDbError(error),
      { status: 500 }
    );
  }
}

// GET method to test the endpoint
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Batch conversion endpoint. Use POST method with codes array and system parameter.',
    example: {
      method: 'POST',
      body: {
        codes: ['E10.10', 'E11.65', 'I10'],
        system: 'icd10'
      }
    }
  });
}
