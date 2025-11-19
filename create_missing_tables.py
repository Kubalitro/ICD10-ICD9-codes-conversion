"""
Create missing tables from schema.sql
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

print("Creating missing tables...")
print("=" * 50)

conn = psycopg2.connect(DATABASE_URL)
cursor = conn.cursor()

# SQL to create missing tables
sql_statements = """
-- Elixhauser categories
CREATE TABLE IF NOT EXISTS elixhauser_categories (
    code VARCHAR(20) PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT
);

-- Insert Elixhauser categories
INSERT INTO elixhauser_categories (code, name, description) VALUES
('AIDS', 'AIDS', 'Acquired immune deficiency syndrome'),
('ALCOHOL', 'ALCOHOL', 'Alcohol abuse'),
('ANEMDEF', 'ANEMDEF', 'Deficiency anemias'),
('AUTOIMMUNE', 'AUTOIMMUNE', 'Autoimmune conditions'),
('BLDLOSS', 'BLDLOSS', 'Blood loss anemia'),
('CANCER_LEUK', 'CANCER_LEUK', 'Leukemia'),
('CANCER_LYMPH', 'CANCER_LYMPH', 'Lymphoma'),
('CANCER_METS', 'CANCER_METS', 'Metastatic cancer'),
('CANCER_NSITU', 'CANCER_NSITU', 'Solid tumor without metastasis, in situ'),
('CANCER_SOLID', 'CANCER_SOLID', 'Solid tumor without metastasis'),
('CBVD_POA', 'CBVD_POA', 'Cerebrovascular disease, present on admission'),
('CBVD_SQLA', 'CBVD_SQLA', 'Cerebrovascular disease, sequela'),
('COAG', 'COAG', 'Coagulopathy'),
('DEMENTIA', 'DEMENTIA', 'Dementia'),
('DEPRESS', 'DEPRESS', 'Depression'),
('DIAB_CX', 'DIAB_CX', 'Diabetes with chronic complications'),
('DIAB_UNCX', 'DIAB_UNCX', 'Diabetes without chronic complications'),
('DRUG_ABUSE', 'DRUG_ABUSE', 'Drug abuse'),
('HF', 'HF', 'Heart failure'),
('HTN_CX', 'HTN_CX', 'Hypertension, complicated'),
('HTN_UNCX', 'HTN_UNCX', 'Hypertension, uncomplicated'),
('LIVER_MLD', 'LIVER_MLD', 'Liver disease, mild'),
('LIVER_SEV', 'LIVER_SEV', 'Liver disease, moderate to severe'),
('LUNG_CHRONIC', 'LUNG_CHRONIC', 'Chronic pulmonary disease'),
('NEURO_MOVT', 'NEURO_MOVT', 'Neurological disorders affecting movement'),
('NEURO_OTH', 'NEURO_OTH', 'Other neurological disorders'),
('NEURO_SEIZ', 'NEURO_SEIZ', 'Seizures and epilepsy'),
('OBESE', 'OBESE', 'Obesity'),
('PARALYSIS', 'PARALYSIS', 'Paralysis'),
('PERIVASC', 'PERIVASC', 'Peripheral vascular disease'),
('PSYCHOSES', 'PSYCHOSES', 'Psychoses'),
('PULMCIRC', 'PULMCIRC', 'Pulmonary circulation disease'),
('RENLFL_MOD', 'RENLFL_MOD', 'Renal failure, moderate'),
('RENLFL_SEV', 'RENLFL_SEV', 'Renal failure, severe'),
('THYROID_HYPO', 'THYROID_HYPO', 'Hypothyroidism'),
('THYROID_OTH', 'THYROID_OTH', 'Other thyroid disorders'),
('ULCER_PEPTIC', 'ULCER_PEPTIC', 'Peptic ulcer disease'),
('VALVE', 'VALVE', 'Valvular disease'),
('WGHTLOSS', 'WGHTLOSS', 'Weight loss')
ON CONFLICT (code) DO NOTHING;

-- Elixhauser mappings
CREATE TABLE IF NOT EXISTS elixhauser_mappings (
    id SERIAL PRIMARY KEY,
    icd10_code VARCHAR(10) NOT NULL,
    category_code VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (icd10_code) REFERENCES icd10_codes(code),
    FOREIGN KEY (category_code) REFERENCES elixhauser_categories(code)
);

CREATE INDEX IF NOT EXISTS idx_elixhauser_icd10 ON elixhauser_mappings(icd10_code);
CREATE INDEX IF NOT EXISTS idx_elixhauser_category ON elixhauser_mappings(category_code);

-- Charlson categories
CREATE TABLE IF NOT EXISTS charlson_categories (
    id SERIAL PRIMARY KEY,
    condition_name VARCHAR(100) UNIQUE NOT NULL,
    score INTEGER NOT NULL,
    description TEXT
);

-- Insert Charlson categories
INSERT INTO charlson_categories (condition_name, score, description) VALUES
('Myocardial Infarction', 1, 'Myocardial infarction'),
('Old Myocardial Infarction', 1, 'Old myocardial infarction'),
('Congestive Heart Failure', 1, 'Congestive heart failure'),
('Peripheral Vascular Disease', 1, 'Peripheral vascular disease'),
('Cerebrovascular Disease', 1, 'Cerebrovascular disease'),
('Dementia', 1, 'Dementia'),
('Chronic Pulmonary Disease', 1, 'Chronic pulmonary disease'),
('Rheumatic Disease', 1, 'Rheumatic disease'),
('Peptic Ulcer Disease', 1, 'Peptic ulcer disease'),
('Mild Liver Disease', 1, 'Mild liver disease'),
('Diabetes without Complications', 1, 'Diabetes without chronic complications'),
('Diabetes with Complications', 2, 'Diabetes with chronic complications'),
('Hemiplegia or Paraplegia', 2, 'Hemiplegia or paraplegia'),
('Renal Disease', 2, 'Renal disease'),
('Any Malignancy', 2, 'Any malignancy including leukemia and lymphoma'),
('Moderate or Severe Liver Disease', 3, 'Moderate or severe liver disease'),
('Metastatic Solid Tumor', 6, 'Metastatic solid tumor'),
('AIDS/HIV', 6, 'AIDS/HIV')
ON CONFLICT (condition_name) DO NOTHING;

-- Charlson ICD-10 mappings
CREATE TABLE IF NOT EXISTS charlson_icd10_mappings (
    id SERIAL PRIMARY KEY,
    icd10_code VARCHAR(10) NOT NULL,
    condition_name VARCHAR(100) NOT NULL,
    score INTEGER NOT NULL,
    is_prefix BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (condition_name) REFERENCES charlson_categories(condition_name)
);

CREATE INDEX IF NOT EXISTS idx_charlson_icd10_code ON charlson_icd10_mappings(icd10_code);
CREATE INDEX IF NOT EXISTS idx_charlson_icd10_prefix ON charlson_icd10_mappings USING btree (icd10_code text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_charlson_icd10_condition ON charlson_icd10_mappings(condition_name);

-- Charlson ICD-9 mappings
CREATE TABLE IF NOT EXISTS charlson_icd9_mappings (
    id SERIAL PRIMARY KEY,
    icd9_code VARCHAR(10) NOT NULL,
    condition_name VARCHAR(100) NOT NULL,
    score INTEGER NOT NULL,
    is_prefix BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (condition_name) REFERENCES charlson_categories(condition_name)
);

CREATE INDEX IF NOT EXISTS idx_charlson_icd9_code ON charlson_icd9_mappings(icd9_code);
CREATE INDEX IF NOT EXISTS idx_charlson_icd9_prefix ON charlson_icd9_mappings USING btree (icd9_code text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_charlson_icd9_condition ON charlson_icd9_mappings(condition_name);

-- Metadata
CREATE TABLE IF NOT EXISTS metadata (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert metadata
INSERT INTO metadata (key, value) VALUES
('icd10_version', '2026'),
('icd9_version', 'FY2015'),
('gems_source', 'CMS.gov General Equivalence Mappings'),
('elixhauser_version', 'v2025.1 Refined'),
('elixhauser_source', 'HCUP-US-AHRQ.gov'),
('charlson_source', 'PMC-NCBI CDMF Charlson Comorbidity Index'),
('last_updated', CURRENT_DATE::TEXT)
ON CONFLICT (key) DO NOTHING;
"""

try:
    # Execute all statements
    cursor.execute(sql_statements)
    conn.commit()
    
    print("[OK] Successfully created missing tables!")
    
    # Verify
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
    """)
    
    tables = cursor.fetchall()
    print(f"\nTotal tables now: {len(tables)}")
    for table in tables:
        print(f"  - {table[0]}")
    
except Exception as e:
    print(f"[ERROR] Failed to create tables: {e}")
    conn.rollback()
finally:
    conn.close()
