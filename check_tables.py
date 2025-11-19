"""
Check which tables exist in the database
"""
import os
import psycopg2
from dotenv import load_dotenv

# Load .env from database folder
load_dotenv('database/.env')
DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found!")
    exit(1)

conn = psycopg2.connect(DATABASE_URL)
cursor = conn.cursor()

# Get all tables in the public schema
cursor.execute("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
""")

tables = cursor.fetchall()

print("Tables in database:")
print("=" * 50)
for table in tables:
    print(f"  - {table[0]}")

print(f"\nTotal: {len(tables)} tables")

# Check which tables from schema.sql are missing
expected_tables = [
    'icd10_codes',
    'icd9_codes',
    'icd10_to_icd9_mapping',
    'icd9_to_icd10_mapping',
    'elixhauser_categories',
    'elixhauser_mappings',
    'charlson_categories',
    'charlson_icd10_mappings',
    'charlson_icd9_mappings',
    'metadata'
]

existing_table_names = [t[0] for t in tables]
missing_tables = [t for t in expected_tables if t not in existing_table_names]

if missing_tables:
    print("\nMissing tables:")
    print("=" * 50)
    for table in missing_tables:
        print(f"  - {table}")

conn.close()
