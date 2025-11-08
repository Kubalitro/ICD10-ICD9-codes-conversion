"""
Load Elixhauser classifications from JSON
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

# Elixhauser category descriptions
ELIXHAUSER_CATEGORIES = {
    'AIDS': 'Acquired immune deficiency syndrome',
    'ALCOHOL': 'Alcohol abuse',
    'ANEMDEF': 'Deficiency anemias',
    'AUTOIMMUNE': 'Autoimmune conditions',
    'BLDLOSS': 'Blood loss anemia',
    'CANCER_LEUK': 'Leukemia',
    'CANCER_LYMPH': 'Lymphoma',
    'CANCER_METS': 'Metastatic cancer',
    'CANCER_NSITU': 'Solid tumor without metastasis, in situ',
    'CANCER_SOLID': 'Solid tumor without metastasis',
    'CBVD': 'Cerebrovascular disease',
    'CBVD_POA': 'Cerebrovascular disease, present on admission',
    'CBVD_SQLA': 'Cerebrovascular disease, sequela',
    'COAG': 'Coagulopathy',
    'DEMENTIA': 'Dementia',
    'DEPRESS': 'Depression',
    'DIAB_CX': 'Diabetes with chronic complications',
    'DIAB_UNCX': 'Diabetes without chronic complications',
    'DRUG_ABUSE': 'Drug abuse',
    'HTN_CX': 'Hypertension, complicated',
    'HTN_UNCX': 'Hypertension, uncomplicated',
    'LIVER_MLD': 'Liver disease, mild',
    'LIVER_SEV': 'Liver disease, moderate to severe',
    'LUNG_CHRONIC': 'Chronic pulmonary disease',
    'NEURO_MOVT': 'Neurological disorders affecting movement',
    'NEURO_OTH': 'Other neurological disorders',
    'NEURO_SEIZURE': 'Seizure disorders and convulsions',
    'OBESE': 'Obesity',
    'PARALYSIS': 'Paralysis',
    'PERIVASC': 'Peripheral vascular disease',
    'PSYCHOSES': 'Psychoses',
    'PULMCIRC': 'Pulmonary circulation disease',
    'RENLFL_MOD': 'Renal failure, moderate',
    'RENLFL_SEV': 'Renal failure, severe',
    'THYROID_HYPO': 'Hypothyroidism',
    'THYROID_OTH': 'Other thyroid disorders',
    'ULCER_PEPTIC': 'Peptic ulcer disease excluding bleeding',
    'VALVE': 'Valvular disease',
    'WGHTLOSS': 'Weight loss'
}

def load_elixhauser():
    """Load Elixhauser classifications"""
    print("\n=== Loading Elixhauser Classifications ===")
    
    with open('data/elixhauser.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"  Found {len(data)} ICD-10 codes with Elixhauser classifications")
    
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    # Collect all unique categories
    categories_seen = set()
    mappings = []
    
    for icd10_code, info in data.items():
        if isinstance(info, dict):
            comorbidities = info.get('comorbidities', [])
            
            for category_code in comorbidities:
                categories_seen.add(category_code)
                mappings.append((icd10_code, category_code))
    
    print(f"  Found {len(categories_seen)} unique categories")
    print(f"  Categories: {sorted(categories_seen)}")
    
    # Insert categories
    categories_to_insert = []
    for cat_code in categories_seen:
        cat_name = cat_code
        cat_desc = ELIXHAUSER_CATEGORIES.get(cat_code, f'Elixhauser category: {cat_code}')
        categories_to_insert.append((cat_code, cat_name, cat_desc))
    
    execute_batch(
        cursor,
        """INSERT INTO elixhauser_categories (code, name, description)
           VALUES (%s, %s, %s)
           ON CONFLICT (code) DO NOTHING""",
        categories_to_insert,
        page_size=100
    )
    conn.commit()
    print(f"  [OK] Loaded {len(categories_to_insert)} Elixhauser categories")
    
    # Insert mappings
    execute_batch(
        cursor,
        """INSERT INTO elixhauser_mappings (icd10_code, category_code)
           VALUES (%s, %s)
           ON CONFLICT (icd10_code, category_code) DO NOTHING""",
        mappings,
        page_size=1000
    )
    conn.commit()
    print(f"  [OK] Loaded {len(mappings)} Elixhauser mappings")
    
    cursor.close()
    conn.close()
    
    return len(mappings)

def main():
    print("=" * 60)
    print("Loading Elixhauser Data")
    print("=" * 60)
    
    try:
        # Test connection
        conn = psycopg2.connect(DATABASE_URL)
        conn.close()
        print("\n[OK] Database connection successful")
        
        # Load Elixhauser
        load_elixhauser()
        
        print("\n" + "=" * 60)
        print("[SUCCESS] Elixhauser data loaded successfully!")
        print("=" * 60)
        
        # Summary
        print("\nSummary:")
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM elixhauser_categories")
        print(f"  - Elixhauser categories: {cursor.fetchone()[0]:,}")
        
        cursor.execute("SELECT COUNT(*) FROM elixhauser_mappings")
        print(f"  - Elixhauser mappings: {cursor.fetchone()[0]:,}")
        
        # Show sample categories
        cursor.execute("""
            SELECT ec.code, ec.name, COUNT(em.icd10_code) as code_count
            FROM elixhauser_categories ec
            LEFT JOIN elixhauser_mappings em ON ec.code = em.category_code
            GROUP BY ec.code, ec.name
            ORDER BY code_count DESC
            LIMIT 10
        """)
        
        print("\n  Top 10 categories by code count:")
        for row in cursor.fetchall():
            print(f"    - {row[0]}: {row[2]:,} codes")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
