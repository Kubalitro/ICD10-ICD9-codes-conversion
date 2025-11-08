"""
Create only the missing tables (mappings, elixhauser, charlson)
"""

import os
import sys
import psycopg2

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Database URL
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://neondb_owner:npg_2juX6QvRKyYI@ep-muddy-night-aggdzucy.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require')

CREATE_TABLES_SQL = """
-- ICD-10 to ICD-9 Mappings
CREATE TABLE IF NOT EXISTS icd10_to_icd9_mapping (
    id SERIAL PRIMARY KEY,
    icd10_code VARCHAR(10) NOT NULL,
    icd9_code VARCHAR(10) NOT NULL,
    approximate BOOLEAN DEFAULT FALSE,
    no_map BOOLEAN DEFAULT FALSE,
    combination BOOLEAN DEFAULT FALSE,
    scenario INTEGER DEFAULT 0,
    choice_list INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(icd10_code, icd9_code)
);

CREATE INDEX IF NOT EXISTS idx_icd10_to_icd9_icd10 ON icd10_to_icd9_mapping(icd10_code);
CREATE INDEX IF NOT EXISTS idx_icd10_to_icd9_icd9 ON icd10_to_icd9_mapping(icd9_code);

-- ICD-9 to ICD-10 Mappings
CREATE TABLE IF NOT EXISTS icd9_to_icd10_mapping (
    id SERIAL PRIMARY KEY,
    icd9_code VARCHAR(10) NOT NULL,
    icd10_code VARCHAR(10) NOT NULL,
    approximate BOOLEAN DEFAULT FALSE,
    no_map BOOLEAN DEFAULT FALSE,
    combination BOOLEAN DEFAULT FALSE,
    scenario INTEGER DEFAULT 0,
    choice_list INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(icd9_code, icd10_code)
);

CREATE INDEX IF NOT EXISTS idx_icd9_to_icd10_icd9 ON icd9_to_icd10_mapping(icd9_code);
CREATE INDEX IF NOT EXISTS idx_icd9_to_icd10_icd10 ON icd9_to_icd10_mapping(icd10_code);

-- Elixhauser Categories
CREATE TABLE IF NOT EXISTS elixhauser_categories (
    code VARCHAR(20) PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT
);

-- Elixhauser Mappings
CREATE TABLE IF NOT EXISTS elixhauser_mappings (
    id SERIAL PRIMARY KEY,
    icd10_code VARCHAR(10) NOT NULL,
    category_code VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(icd10_code, category_code)
);

CREATE INDEX IF NOT EXISTS idx_elixhauser_icd10 ON elixhauser_mappings(icd10_code);
CREATE INDEX IF NOT EXISTS idx_elixhauser_category ON elixhauser_mappings(category_code);

-- Charlson ICD-10
CREATE TABLE IF NOT EXISTS charlson_icd10 (
    code VARCHAR(10) PRIMARY KEY,
    condition VARCHAR(100) NOT NULL,
    score INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_charlson_icd10_condition ON charlson_icd10(condition);

-- Charlson ICD-9
CREATE TABLE IF NOT EXISTS charlson_icd9 (
    code VARCHAR(10) PRIMARY KEY,
    condition VARCHAR(100) NOT NULL,
    score INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_charlson_icd9_condition ON charlson_icd9(condition);
"""

def main():
    print("=" * 60)
    print("Creating Missing Database Tables")
    print("=" * 60)
    
    try:
        # Connect to database
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        print("\n[OK] Connected to database")
        
        print("\nCreating missing tables...")
        cursor.execute(CREATE_TABLES_SQL)
        conn.commit()
        
        print("\n[SUCCESS] All missing tables created successfully!")
        
        # List all tables
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        """)
        
        tables = cursor.fetchall()
        print(f"\nTotal tables in database: {len(tables)}")
        for table in tables:
            print(f"  - {table[0]}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
