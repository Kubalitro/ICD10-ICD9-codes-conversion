"""
Data Loading Script for Neon PostgreSQL Database
Loads ICD codes, mappings, Elixhauser, and Charlson data

Requirements:
pip install psycopg2-binary pandas openpyxl python-dotenv
"""

import os
import csv
import pandas as pd
import psycopg2
from psycopg2.extras import execute_batch
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get database connection string from environment
DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found in environment variables.")
    print("Please create a .env file with your Neon database connection string:")
    print("DATABASE_URL=postgresql://user:password@host/database")
    exit(1)

def get_connection():
    """Create and return a database connection"""
    return psycopg2.connect(DATABASE_URL)

def load_icd10_codes(conn):
    """Load ICD-10-CM codes and descriptions"""
    print("\n=== Loading ICD-10-CM codes ===")
    
    codes = []
    with open('icd10cm_codes_2026.txt', 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                parts = line.strip().split(maxsplit=1)
                if len(parts) == 2:
                    code, description = parts
                    codes.append((code, description))
    
    cursor = conn.cursor()
    
    # Insert codes
    execute_batch(
        cursor,
        "INSERT INTO icd10_codes (code, description) VALUES (%s, %s) ON CONFLICT (code) DO NOTHING",
        codes
    )
    
    conn.commit()
    print(f"  [OK] Loaded {len(codes)} ICD-10-CM codes")

def load_icd9_codes(conn):
    """Load ICD-9-CM codes from the mapping files"""
    print("\n=== Loading ICD-9-CM codes ===")
    
    icd9_codes = set()
    
    # Extract ICD-9 codes from both mapping files
    with open('icd10cmtoicd9gem.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            icd9_codes.add(row['icd9cm'])
    
    with open('icd9toicd10cmgem.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            icd9_codes.add(row['icd9cm'])
    
    cursor = conn.cursor()
    
    # Insert codes
    execute_batch(
        cursor,
        "INSERT INTO icd9_codes (code) VALUES (%s) ON CONFLICT (code) DO NOTHING",
        [(code,) for code in icd9_codes]
    )
    
    conn.commit()
    print(f"  [OK] Loaded {len(icd9_codes)} ICD-9-CM codes")

def load_icd10_to_icd9_mappings(conn):
    """Load ICD-10 to ICD-9 mappings"""
    print("\n=== Loading ICD-10 to ICD-9 mappings ===")
    
    cursor = conn.cursor()
    
    # Check if table already has data
    cursor.execute("SELECT COUNT(*) FROM icd10_to_icd9_mapping")
    existing_count = cursor.fetchone()[0]
    
    if existing_count > 0:
        print(f"  [i] Table already has {existing_count} mappings. Clearing...")
        cursor.execute("TRUNCATE TABLE icd10_to_icd9_mapping CASCADE")
        conn.commit()
    
    # Get all valid ICD-10 codes from database
    cursor.execute("SELECT code FROM icd10_codes")
    valid_icd10_codes = set(row[0] for row in cursor.fetchall())
    print(f"  [i] Found {len(valid_icd10_codes)} valid ICD-10 codes in database")
    
    # Use a set to track unique combinations and avoid duplicates
    seen_pairs = set()
    mappings = []
    skipped = 0
    duplicates = 0
    
    with open('icd10cmtoicd9gem.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            icd10_code = row['icd10cm']
            icd9_code = row['icd9cm']
            
            # Skip mappings for codes that don't exist in icd10_codes table
            if icd10_code not in valid_icd10_codes:
                skipped += 1
                continue
            
            # Skip duplicates
            pair = (icd10_code, icd9_code)
            if pair in seen_pairs:
                duplicates += 1
                continue
            seen_pairs.add(pair)
                
            mappings.append((
                icd10_code,
                icd9_code,
                row['approximate'] == '1',
                row['no_map'] == '1',
                row['combination'] == '1',
                int(row['scenario']),
                int(row['choice_list']),
                'CMS_GEMs'
            ))
    
    if skipped > 0:
        print(f"  [WARN] Skipped {skipped} mappings with non-existent ICD-10 codes")
    if duplicates > 0:
        print(f"  [WARN] Skipped {duplicates} duplicate mappings")
    
    execute_batch(
        cursor,
        """
        INSERT INTO icd10_to_icd9_mapping 
        (icd10_code, icd9_code, approximate, no_map, combination, scenario, choice_list, source)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        mappings
    )
    
    conn.commit()
    print(f"  [OK] Loaded {len(mappings)} ICD-10 to ICD-9 mappings")

def load_icd9_to_icd10_mappings(conn):
    """Load ICD-9 to ICD-10 mappings"""
    print("\n=== Loading ICD-9 to ICD-10 mappings ===")
    
    cursor = conn.cursor()
    
    # Check if table already has data
    cursor.execute("SELECT COUNT(*) FROM icd9_to_icd10_mapping")
    existing_count = cursor.fetchone()[0]
    
    if existing_count > 0:
        print(f"  [i] Table already has {existing_count} mappings. Clearing...")
        cursor.execute("TRUNCATE TABLE icd9_to_icd10_mapping CASCADE")
        conn.commit()
    
    # Get all valid ICD-10 codes from database
    cursor.execute("SELECT code FROM icd10_codes")
    valid_icd10_codes = set(row[0] for row in cursor.fetchall())
    print(f"  [i] Found {len(valid_icd10_codes)} valid ICD-10 codes in database")
    
    # Use a set to track unique combinations and avoid duplicates
    seen_pairs = set()
    mappings = []
    skipped = 0
    duplicates = 0
    
    with open('icd9toicd10cmgem.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            icd10_code = row['icd10cm']
            icd9_code = row['icd9cm']
            
            # Skip mappings for codes that don't exist in icd10_codes table
            if icd10_code not in valid_icd10_codes:
                skipped += 1
                continue
            
            # Skip duplicates
            pair = (icd9_code, icd10_code)
            if pair in seen_pairs:
                duplicates += 1
                continue
            seen_pairs.add(pair)
                
            mappings.append((
                icd9_code,
                icd10_code,
                row['approximate'] == '1',
                row['no_map'] == '1',
                row['combination'] == '1',
                int(row['scenario']),
                int(row['choice_list']),
                'CMS_GEMs'
            ))
    
    if skipped > 0:
        print(f"  [WARN] Skipped {skipped} mappings with non-existent ICD-10 codes")
    if duplicates > 0:
        print(f"  [WARN] Skipped {duplicates} duplicate mappings")
    
    execute_batch(
        cursor,
        """
        INSERT INTO icd9_to_icd10_mapping 
        (icd9_code, icd10_code, approximate, no_map, combination, scenario, choice_list, source)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        mappings
    )
    
    conn.commit()
    print(f"  [OK] Loaded {len(mappings)} ICD-9 to ICD-10 mappings")

def load_elixhauser_mappings(conn):
    """Load Elixhauser comorbidity mappings from CMR Excel file"""
    print("\n=== Loading Elixhauser mappings ===")
    
    cursor = conn.cursor()
    
    # Get all valid ICD-10 codes from database
    cursor.execute("SELECT code FROM icd10_codes")
    valid_icd10_codes = set(row[0] for row in cursor.fetchall())
    print(f"  [i] Found {len(valid_icd10_codes)} valid ICD-10 codes in database")
    
    # Read Excel file
    df = pd.read_excel('CMR-Reference-File-v2025-1.xlsx', sheet_name='DX_to_Comorb_Mapping', header=0)
    
    # Get actual headers from first row
    actual_headers = df.iloc[0]
    df = df[1:]
    df.columns = actual_headers
    
    code_col = 'ICD-10-CM Diagnosis'
    
    # Get comorbidity columns (skip code, description, # comorbidities)
    comorbidity_cols = [col for col in df.columns if col not in [code_col, 'ICD-10-CM Code Description', '# Comorbidities'] and pd.notna(col)]
    
    mappings = []
    skipped = 0
    
    for _, row in df.iterrows():
        code = row[code_col]
        
        if pd.notna(code) and isinstance(code, str) and code.strip():
            code_clean = code.strip()
            
            # Skip codes that don't exist in icd10_codes table
            if code_clean not in valid_icd10_codes:
                skipped += 1
                continue
            
            for comorb in comorbidity_cols:
                if pd.notna(row[comorb]) and (str(row[comorb]).strip() == '1' or row[comorb] == 1):
                    mappings.append((code_clean, comorb))
    
    if skipped > 0:
        print(f"  [WARN] Skipped {skipped} codes with non-existent ICD-10 codes")
    
    execute_batch(
        cursor,
        """
        INSERT INTO elixhauser_mappings (icd10_code, category_code)
        VALUES (%s, %s)
        ON CONFLICT DO NOTHING
        """,
        mappings
    )
    
    conn.commit()
    print(f"  [OK] Loaded {len(mappings)} Elixhauser mappings")

def load_charlson_icd10_mappings(conn):
    """Load Charlson ICD-10 mappings from process_data.py definitions"""
    print("\n=== Loading Charlson ICD-10 mappings ===")
    
    # Import the Charlson mapping from process_data.py
    import sys
    sys.path.append('.')
    from process_data import create_charlson_mappings
    
    # Load the JSON that was created
    import json
    with open('web/data/charlson_icd10.json', 'r', encoding='utf-8') as f:
        charlson_icd10 = json.load(f)
    
    mappings = []
    for code, data in charlson_icd10.items():
        # Determine if this is a prefix code (family)
        is_prefix = len(code) <= 3 or not any(c in code for c in ['.', ','])
        
        mappings.append((
            code,
            data['condition'],
            data['score'],
            is_prefix
        ))
    
    cursor = conn.cursor()
    
    execute_batch(
        cursor,
        """
        INSERT INTO charlson_icd10_mappings (icd10_code, condition_name, score, is_prefix)
        VALUES (%s, %s, %s, %s)
        """,
        mappings
    )
    
    conn.commit()
    print(f"  [OK] Loaded {len(mappings)} Charlson ICD-10 mappings")

def load_charlson_icd9_mappings(conn):
    """Load Charlson ICD-9 mappings"""
    print("\n=== Loading Charlson ICD-9 mappings ===")
    
    import json
    with open('web/data/charlson_icd9.json', 'r', encoding='utf-8') as f:
        charlson_icd9 = json.load(f)
    
    mappings = []
    for code, data in charlson_icd9.items():
        # Determine if this is a prefix code
        is_prefix = len(code) <= 3 or not any(c in code for c in ['.', ','])
        
        mappings.append((
            code,
            data['condition'],
            data['score'],
            is_prefix
        ))
    
    cursor = conn.cursor()
    
    execute_batch(
        cursor,
        """
        INSERT INTO charlson_icd9_mappings (icd9_code, condition_name, score, is_prefix)
        VALUES (%s, %s, %s, %s)
        """,
        mappings
    )
    
    conn.commit()
    print(f"  [OK] Loaded {len(mappings)} Charlson ICD-9 mappings")

def verify_data(conn):
    """Verify that data was loaded correctly"""
    print("\n=== Verifying data ===")
    
    cursor = conn.cursor()
    
    tables = [
        'icd10_codes',
        'icd9_codes',
        'icd10_to_icd9_mapping',
        'icd9_to_icd10_mapping',
        'elixhauser_mappings',
        'charlson_icd10_mappings',
        'charlson_icd9_mappings'
    ]
    
    for table in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        print(f"  {table}: {count:,} rows")
    
    # Test family query
    try:
        cursor.execute("SELECT * FROM get_code_family('E10') LIMIT 5")
        results = cursor.fetchall()
        print(f"\n  Sample family query (E10): {len(results)} results (showing first 5)")
        for row in results:
            if len(row) >= 2:
                print(f"    {row[0]}: {row[1]}")
            else:
                print(f"    {row}")
    except Exception as e:
        print(f"\n  [WARN] Family query test skipped: {e}")

def main():
    """Main execution function"""
    print("==============================================")
    print("ICD Code Database Loader for Neon PostgreSQL")
    print("==============================================")
    
    try:
        # First, make sure JSON files exist
        print("\nChecking for required Charlson JSON files...")
        if not os.path.exists('web/data/charlson_icd10.json') or not os.path.exists('web/data/charlson_icd9.json'):
            print("  JSON files not found. Running process_data.py first...")
            from process_data import main as process_main
            process_main()
        
        # Connect to database
        print("\nConnecting to Neon database...")
        conn = get_connection()
        print("  [OK] Connected successfully")
        
        # Load data in order (respecting foreign key constraints)
        load_icd10_codes(conn)
        load_icd9_codes(conn)
        load_icd10_to_icd9_mappings(conn)
        load_icd9_to_icd10_mappings(conn)
        load_elixhauser_mappings(conn)
        load_charlson_icd10_mappings(conn)
        load_charlson_icd9_mappings(conn)
        
        # Verify
        verify_data(conn)
        
        print("\n==============================================")
        print("[OK] Data loading completed successfully!")
        print("==============================================")
        
        conn.close()
        
    except Exception as e:
        print(f"\n[ERROR] Error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)

if __name__ == "__main__":
    main()
