"""
Load ICD data from JSON files into Neon PostgreSQL
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

def load_icd10_descriptions():
    """Load ICD-10 codes and descriptions"""
    print("\n=== Loading ICD-10 Codes ===")
    
    with open('data/icd10_descriptions.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    codes = [(code, desc) for code, desc in data.items()]
    
    execute_batch(
        cursor,
        "INSERT INTO icd10_codes (code, description) VALUES (%s, %s) ON CONFLICT (code) DO NOTHING",
        codes,
        page_size=1000
    )
    
    conn.commit()
    count = cursor.rowcount
    conn.close()
    
    print(f"  [OK] Loaded {len(codes)} ICD-10 codes")
    return len(codes)

def load_icd10_to_icd9():
    """Load ICD-10 to ICD-9 mappings"""
    print("\n=== Loading ICD-10 to ICD-9 Mappings ===")
    
    with open('data/icd10_to_icd9.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    mappings = []
    icd9_codes = set()
    
    for icd10, conversions in data.items():
        if isinstance(conversions, list):
            for conv in conversions:
                if isinstance(conv, dict):
                    icd9 = conv.get('icd9_code', conv.get('code'))
                    if icd9:
                        icd9_codes.add(icd9)
                        mappings.append((
                            icd10,
                            icd9,
                            conv.get('approximate', False),
                            conv.get('no_map', False),
                            conv.get('combination', False),
                            conv.get('scenario', 1),
                            conv.get('choice_list', 1)
                        ))
    
    # Load ICD-9 codes first
    print("  → Loading ICD-9 codes...")
    icd9_data = [(code,) for code in icd9_codes]
    execute_batch(
        cursor,
        "INSERT INTO icd9_codes (code) VALUES (%s) ON CONFLICT (code) DO NOTHING",
        icd9_data,
        page_size=1000
    )
    conn.commit()
    print(f"  ✓ Loaded {len(icd9_codes)} ICD-9 codes")
    
    # Load mappings
    print("  → Loading mappings...")
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
    conn.close()
    
    print(f"  ✓ Loaded {len(mappings)} ICD-10→ICD-9 mappings")
    return len(mappings)

def load_icd9_to_icd10():
    """Load ICD-9 to ICD-10 mappings"""
    print("\n=== Loading ICD-9 to ICD-10 Mappings ===")
    
    with open('data/icd9_to_icd10.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    mappings = []
    
    for icd9, conversions in data.items():
        if isinstance(conversions, list):
            for conv in conversions:
                if isinstance(conv, dict):
                    icd10 = conv.get('icd10_code', conv.get('code'))
                    if icd10:
                        mappings.append((
                            icd9,
                            icd10,
                            conv.get('approximate', False),
                            conv.get('no_map', False),
                            conv.get('combination', False),
                            conv.get('scenario', 1),
                            conv.get('choice_list', 1)
                        ))
    
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
    conn.close()
    
    print(f"  [OK] Loaded {len(mappings)} ICD-9->ICD-10 mappings")
    return len(mappings)

def load_elixhauser():
    """Load Elixhauser classifications"""
    print("\n=== Loading Elixhauser Classifications ===")
    
    with open('data/elixhauser.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    # Load categories
    categories = set()
    for item in data:
        if isinstance(item, dict):
            cat_code = item.get('category_code')
            cat_name = item.get('category_name', cat_code)
            cat_desc = item.get('category_description', cat_name)
            if cat_code:
                categories.add((cat_code, cat_name, cat_desc))
    
    execute_batch(
        cursor,
        """INSERT INTO elixhauser_categories (code, name, description)
           VALUES (%s, %s, %s)
           ON CONFLICT (code) DO NOTHING""",
        list(categories),
        page_size=100
    )
    conn.commit()
    print(f"  ✓ Loaded {len(categories)} Elixhauser categories")
    
    # Load mappings
    mappings = []
    for item in data:
        if isinstance(item, dict):
            icd10 = item.get('icd10_code')
            cat_code = item.get('category_code')
            if icd10 and cat_code:
                mappings.append((icd10, cat_code))
    
    execute_batch(
        cursor,
        """INSERT INTO elixhauser_mappings (icd10_code, category_code)
           VALUES (%s, %s)
           ON CONFLICT (icd10_code, category_code) DO NOTHING""",
        mappings,
        page_size=1000
    )
    
    conn.commit()
    conn.close()
    
    print(f"  ✓ Loaded {len(mappings)} Elixhauser mappings")
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
    
    # Load ICD-10 Charlson
    icd10_mappings = []
    for condition, info in icd10_data.items():
        score = info.get('score', 1)
        codes = info.get('codes', [])
        for code in codes:
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
    print(f"  ✓ Loaded {len(icd10_mappings)} ICD-10 Charlson mappings")
    
    # Load ICD-9 Charlson
    icd9_mappings = []
    for condition, info in icd9_data.items():
        score = info.get('score', 1)
        codes = info.get('codes', [])
        for code in codes:
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
    conn.close()
    
    print(f"  ✓ Loaded {len(icd9_mappings)} ICD-9 Charlson mappings")
    return len(icd10_mappings) + len(icd9_mappings)

def main():
    print("=" * 50)
    print("Loading ICD Data from JSON files")
    print("=" * 50)
    
    try:
        # Test connection
        conn = psycopg2.connect(DATABASE_URL)
        conn.close()
        print("\n✓ Database connection successful")
        
        # Load all data
        load_icd10_descriptions()
        load_icd10_to_icd9()
        load_icd9_to_icd10()
        load_elixhauser()
        load_charlson()
        
        print("\n" + "=" * 50)
        print("✓ ALL DATA LOADED SUCCESSFULLY!")
        print("=" * 50)
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
