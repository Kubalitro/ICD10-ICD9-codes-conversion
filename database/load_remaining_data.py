"""
Load remaining data: mappings, Elixhauser, and Charlson
"""

import os
import sys
import json
import psycopg2
from psycopg2.extras import execute_batch

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Database URL
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://neondb_owner:npg_2juX6QvRKyYI@ep-muddy-night-aggdzucy.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require')

def load_icd9_codes():
    """Load ICD-9 codes from mappings"""
    print("\n=== Loading ICD-9 Codes ===")
    
    # Load from ICD-10 to ICD-9 mappings
    with open('data/icd10_to_icd9.json', 'r', encoding='utf-8') as f:
        icd10_to_icd9 = json.load(f)
    
    # Load from ICD-9 to ICD-10 mappings
    with open('data/icd9_to_icd10.json', 'r', encoding='utf-8') as f:
        icd9_to_icd10 = json.load(f)
    
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    # Collect all unique ICD-9 codes
    icd9_codes = set()
    
    # From ICD-10 to ICD-9
    for icd10, mappings in icd10_to_icd9.items():
        if isinstance(mappings, list):
            for mapping in mappings:
                if isinstance(mapping, dict) and 'icd9' in mapping:
                    icd9_codes.add(mapping['icd9'])
    
    # From ICD-9 keys
    icd9_codes.update(icd9_to_icd10.keys())
    
    print(f"  Found {len(icd9_codes)} unique ICD-9 codes")
    
    # Insert ICD-9 codes
    icd9_data = [(code,) for code in icd9_codes]
    execute_batch(
        cursor,
        "INSERT INTO icd9_codes (code) VALUES (%s) ON CONFLICT (code) DO NOTHING",
        icd9_data,
        page_size=1000
    )
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print(f"  [OK] Loaded {len(icd9_codes)} ICD-9 codes")
    return len(icd9_codes)

def load_icd10_to_icd9_mappings():
    """Load ICD-10 to ICD-9 mappings"""
    print("\n=== Loading ICD-10 to ICD-9 Mappings ===")
    
    with open('data/icd10_to_icd9.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    mappings = []
    for icd10, conversions in data.items():
        if isinstance(conversions, list):
            for mapping in conversions:
                if isinstance(mapping, dict):
                    icd9 = mapping.get('icd9')
                    if icd9:
                        mappings.append((
                            icd10,
                            icd9,
                            mapping.get('approximate', False),
                            mapping.get('no_map', False),
                            mapping.get('combination', False),
                            mapping.get('scenario', 1),
                            mapping.get('choice_list', 1)
                        ))
    
    print(f"  Found {len(mappings)} mappings")
    
    execute_batch(
        cursor,
        """INSERT INTO icd10_to_icd9_mapping 
           (icd10_code, icd9_code, approximate, no_map, combination, scenario, choice_list)
           VALUES (%s, %s, %s, %s, %s, %s, %s)
           ON CONFLICT (icd10_code, icd9_code) DO NOTHING""",
        mappings,
        page_size=1000
    )
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print(f"  [OK] Loaded {len(mappings)} ICD-10 -> ICD-9 mappings")
    return len(mappings)

def load_icd9_to_icd10_mappings():
    """Load ICD-9 to ICD-10 mappings"""
    print("\n=== Loading ICD-9 to ICD-10 Mappings ===")
    
    with open('data/icd9_to_icd10.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    mappings = []
    for icd9, conversions in data.items():
        if isinstance(conversions, list):
            for mapping in conversions:
                if isinstance(mapping, dict):
                    icd10 = mapping.get('icd10')
                    if icd10:
                        mappings.append((
                            icd9,
                            icd10,
                            mapping.get('approximate', False),
                            mapping.get('no_map', False),
                            mapping.get('combination', False),
                            mapping.get('scenario', 1),
                            mapping.get('choice_list', 1)
                        ))
    
    print(f"  Found {len(mappings)} mappings")
    
    execute_batch(
        cursor,
        """INSERT INTO icd9_to_icd10_mapping 
           (icd9_code, icd10_code, approximate, no_map, combination, scenario, choice_list)
           VALUES (%s, %s, %s, %s, %s, %s, %s)
           ON CONFLICT (icd9_code, icd10_code) DO NOTHING""",
        mappings,
        page_size=1000
    )
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print(f"  [OK] Loaded {len(mappings)} ICD-9 -> ICD-10 mappings")
    return len(mappings)

def load_elixhauser():
    """Load Elixhauser classifications"""
    print("\n=== Loading Elixhauser Classifications ===")
    
    with open('data/elixhauser.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    # Elixhauser is a dict with ICD codes as keys
    categories = set()
    mappings = []
    
    for icd10_code, category_info in data.items():
        if isinstance(category_info, dict):
            category_code = category_info.get('category')
            category_name = category_info.get('name', category_code)
            category_desc = category_info.get('description', category_name)
            
            if category_code:
                categories.add((category_code, category_name, category_desc))
                mappings.append((icd10_code, category_code))
    
    print(f"  Found {len(categories)} categories and {len(mappings)} mappings")
    
    # Load categories
    execute_batch(
        cursor,
        """INSERT INTO elixhauser_categories (code, name, description)
           VALUES (%s, %s, %s)
           ON CONFLICT (code) DO NOTHING""",
        list(categories),
        page_size=100
    )
    conn.commit()
    print(f"  [OK] Loaded {len(categories)} Elixhauser categories")
    
    # Load mappings
    execute_batch(
        cursor,
        """INSERT INTO elixhauser_mappings (icd10_code, category_code)
           VALUES (%s, %s)
           ON CONFLICT (icd10_code, category_code) DO NOTHING""",
        mappings,
        page_size=1000
    )
    conn.commit()
    cursor.close()
    conn.close()
    
    print(f"  [OK] Loaded {len(mappings)} Elixhauser mappings")
    return len(mappings)

def load_charlson():
    """Load Charlson data"""
    print("\n=== Loading Charlson Data ===")
    
    # Load ICD-10 Charlson
    with open('data/charlson_icd10.json', 'r', encoding='utf-8') as f:
        icd10_data = json.load(f)
    
    # Load ICD-9 Charlson
    with open('data/charlson_icd9.json', 'r', encoding='utf-8') as f:
        icd9_data = json.load(f)
    
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    # Load ICD-10 Charlson - format: {"I21": {"condition": "Myocardial Infarction", "score": 1}}
    icd10_mappings = []
    for code, info in icd10_data.items():
        if isinstance(info, dict):
            condition = info.get('condition', 'Unknown')
            score = info.get('score', 1)
            icd10_mappings.append((code, condition, score))
    
    execute_batch(
        cursor,
        """INSERT INTO charlson_icd10 (code, condition, score)
           VALUES (%s, %s, %s)
           ON CONFLICT (code) DO NOTHING""",
        icd10_mappings,
        page_size=1000
    )
    conn.commit()
    print(f"  [OK] Loaded {len(icd10_mappings)} ICD-10 Charlson mappings")
    
    # Load ICD-9 Charlson
    icd9_mappings = []
    for code, info in icd9_data.items():
        if isinstance(info, dict):
            condition = info.get('condition', 'Unknown')
            score = info.get('score', 1)
            icd9_mappings.append((code, condition, score))
    
    execute_batch(
        cursor,
        """INSERT INTO charlson_icd9 (code, condition, score)
           VALUES (%s, %s, %s)
           ON CONFLICT (code) DO NOTHING""",
        icd9_mappings,
        page_size=1000
    )
    conn.commit()
    cursor.close()
    conn.close()
    
    print(f"  [OK] Loaded {len(icd9_mappings)} ICD-9 Charlson mappings")
    return len(icd10_mappings) + len(icd9_mappings)

def main():
    print("=" * 60)
    print("Loading Remaining Data: Mappings, Elixhauser & Charlson")
    print("=" * 60)
    
    try:
        # Test connection
        conn = psycopg2.connect(DATABASE_URL)
        conn.close()
        print("\n[OK] Database connection successful")
        
        # Load all remaining data
        load_icd9_codes()
        load_icd10_to_icd9_mappings()
        load_icd9_to_icd10_mappings()
        load_elixhauser()
        load_charlson()
        
        print("\n" + "=" * 60)
        print("[SUCCESS] ALL REMAINING DATA LOADED SUCCESSFULLY!")
        print("=" * 60)
        
        # Summary
        print("\nSummary:")
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM icd10_codes")
        print(f"  - ICD-10 codes: {cursor.fetchone()[0]:,}")
        
        cursor.execute("SELECT COUNT(*) FROM icd9_codes")
        print(f"  - ICD-9 codes: {cursor.fetchone()[0]:,}")
        
        cursor.execute("SELECT COUNT(*) FROM icd10_to_icd9_mapping")
        print(f"  - ICD-10 -> ICD-9 mappings: {cursor.fetchone()[0]:,}")
        
        cursor.execute("SELECT COUNT(*) FROM icd9_to_icd10_mapping")
        print(f"  - ICD-9 -> ICD-10 mappings: {cursor.fetchone()[0]:,}")
        
        cursor.execute("SELECT COUNT(*) FROM elixhauser_mappings")
        print(f"  - Elixhauser mappings: {cursor.fetchone()[0]:,}")
        
        cursor.execute("SELECT COUNT(*) FROM charlson_icd10")
        icd10_charlson = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM charlson_icd9")
        icd9_charlson = cursor.fetchone()[0]
        print(f"  - Charlson mappings: {icd10_charlson + icd9_charlson:,} (ICD-10: {icd10_charlson}, ICD-9: {icd9_charlson})")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
