"""
Create database schema with all tables
"""

import os
import sys
import psycopg2

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Database URL
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://neondb_owner:npg_2juX6QvRKyYI@ep-muddy-night-aggdzucy.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require')

def main():
    print("=" * 60)
    print("Creating Database Schema")
    print("=" * 60)
    
    try:
        # Connect to database
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        print("\n[OK] Connected to database")
        
        # Read schema.sql
        print("\nReading schema.sql...")
        with open('schema.sql', 'r', encoding='utf-8') as f:
            schema_sql = f.read()
        
        print("Executing schema...")
        cursor.execute(schema_sql)
        conn.commit()
        
        print("\n[SUCCESS] Schema created successfully!")
        
        # List created tables
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        """)
        
        tables = cursor.fetchall()
        print(f"\nCreated {len(tables)} tables:")
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
