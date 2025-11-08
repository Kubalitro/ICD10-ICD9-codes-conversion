/**
 * Database connection utility for Neon PostgreSQL
 */

import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create a connection pool for reuse
export const sql = neon(process.env.DATABASE_URL);

// Helper function to handle database errors
export function handleDbError(error: any) {
  console.error('Database error:', error);
  return {
    error: 'Database error occurred',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  };
}

// Type definitions for our data structures
export interface ICD10Code {
  code: string;
  description: string;
}

export interface ICD9Code {
  code: string;
}

export interface CodeMapping {
  source_code: string;
  target_code: string;
  approximate: boolean;
  no_map: boolean;
  combination: boolean;
  scenario: number;
  choice_list: number;
}

export interface ElixhauserMapping {
  icd10_code: string;
  category_code: string;
  category_name: string;
  category_description: string;
}

export interface CharlsonResult {
  condition: string;
  score: number;
  match_type: string;
}
