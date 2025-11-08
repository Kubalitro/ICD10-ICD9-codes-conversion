-- =====================================================
-- ICD Code Conversion and Classification Database
-- For Neon PostgreSQL
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- For fuzzy text search

-- =====================================================
-- 1. ICD-10-CM Codes and Descriptions
-- =====================================================
CREATE TABLE icd10_codes (
    code VARCHAR(10) PRIMARY KEY,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for prefix search (families like E10)
CREATE INDEX idx_icd10_code_prefix ON icd10_codes USING btree (code text_pattern_ops);
CREATE INDEX idx_icd10_description_trgm ON icd10_codes USING gin (description gin_trgm_ops);

-- =====================================================
-- 2. ICD-9-CM Codes (basic table for reference)
-- =====================================================
CREATE TABLE icd9_codes (
    code VARCHAR(10) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_icd9_code_prefix ON icd9_codes USING btree (code text_pattern_ops);

-- =====================================================
-- 3. ICD-10 to ICD-9 Mappings (CMS GEMs)
-- =====================================================
CREATE TABLE icd10_to_icd9_mapping (
    id SERIAL PRIMARY KEY,
    icd10_code VARCHAR(10) NOT NULL,
    icd9_code VARCHAR(10) NOT NULL,
    approximate BOOLEAN DEFAULT FALSE,
    no_map BOOLEAN DEFAULT FALSE,
    combination BOOLEAN DEFAULT FALSE,
    scenario INTEGER DEFAULT 0,
    choice_list INTEGER DEFAULT 0,
    source VARCHAR(20) DEFAULT 'CMS_GEMs',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (icd10_code) REFERENCES icd10_codes(code),
    FOREIGN KEY (icd9_code) REFERENCES icd9_codes(code)
);

CREATE INDEX idx_icd10_to_icd9_icd10 ON icd10_to_icd9_mapping(icd10_code);
CREATE INDEX idx_icd10_to_icd9_icd9 ON icd10_to_icd9_mapping(icd9_code);

-- =====================================================
-- 4. ICD-9 to ICD-10 Mappings (CMS GEMs)
-- =====================================================
CREATE TABLE icd9_to_icd10_mapping (
    id SERIAL PRIMARY KEY,
    icd9_code VARCHAR(10) NOT NULL,
    icd10_code VARCHAR(10) NOT NULL,
    approximate BOOLEAN DEFAULT FALSE,
    no_map BOOLEAN DEFAULT FALSE,
    combination BOOLEAN DEFAULT FALSE,
    scenario INTEGER DEFAULT 0,
    choice_list INTEGER DEFAULT 0,
    source VARCHAR(20) DEFAULT 'CMS_GEMs',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (icd9_code) REFERENCES icd9_codes(code),
    FOREIGN KEY (icd10_code) REFERENCES icd10_codes(code)
);

CREATE INDEX idx_icd9_to_icd10_icd9 ON icd9_to_icd10_mapping(icd9_code);
CREATE INDEX idx_icd9_to_icd10_icd10 ON icd9_to_icd10_mapping(icd10_code);

-- =====================================================
-- 5. Elixhauser Comorbidity Categories
-- =====================================================
CREATE TABLE elixhauser_categories (
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
('WGHTLOSS', 'WGHTLOSS', 'Weight loss');

-- =====================================================
-- 6. Elixhauser Mappings (ICD-10 to Comorbidities)
-- =====================================================
CREATE TABLE elixhauser_mappings (
    id SERIAL PRIMARY KEY,
    icd10_code VARCHAR(10) NOT NULL,
    category_code VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (icd10_code) REFERENCES icd10_codes(code),
    FOREIGN KEY (category_code) REFERENCES elixhauser_categories(code)
);

CREATE INDEX idx_elixhauser_icd10 ON elixhauser_mappings(icd10_code);
CREATE INDEX idx_elixhauser_category ON elixhauser_mappings(category_code);

-- =====================================================
-- 7. Charlson Comorbidity Index Categories
-- =====================================================
CREATE TABLE charlson_categories (
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
('AIDS/HIV', 6, 'AIDS/HIV');

-- =====================================================
-- 8. Charlson ICD-10 Mappings
-- =====================================================
CREATE TABLE charlson_icd10_mappings (
    id SERIAL PRIMARY KEY,
    icd10_code VARCHAR(10) NOT NULL,
    condition_name VARCHAR(100) NOT NULL,
    score INTEGER NOT NULL,
    is_prefix BOOLEAN DEFAULT FALSE, -- TRUE if code represents a family (e.g., I50)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (condition_name) REFERENCES charlson_categories(condition_name)
);

CREATE INDEX idx_charlson_icd10_code ON charlson_icd10_mappings(icd10_code);
CREATE INDEX idx_charlson_icd10_prefix ON charlson_icd10_mappings USING btree (icd10_code text_pattern_ops);
CREATE INDEX idx_charlson_icd10_condition ON charlson_icd10_mappings(condition_name);

-- =====================================================
-- 9. Charlson ICD-9 Mappings
-- =====================================================
CREATE TABLE charlson_icd9_mappings (
    id SERIAL PRIMARY KEY,
    icd9_code VARCHAR(10) NOT NULL,
    condition_name VARCHAR(100) NOT NULL,
    score INTEGER NOT NULL,
    is_prefix BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (condition_name) REFERENCES charlson_categories(condition_name)
);

CREATE INDEX idx_charlson_icd9_code ON charlson_icd9_mappings(icd9_code);
CREATE INDEX idx_charlson_icd9_prefix ON charlson_icd9_mappings USING btree (icd9_code text_pattern_ops);
CREATE INDEX idx_charlson_icd9_condition ON charlson_icd9_mappings(condition_name);

-- =====================================================
-- 10. Metadata Table (for versioning and references)
-- =====================================================
CREATE TABLE metadata (
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
('last_updated', CURRENT_DATE::TEXT);

-- =====================================================
-- Useful Views
-- =====================================================

-- View: Complete ICD-10 code information with Elixhauser
CREATE VIEW v_icd10_complete AS
SELECT 
    ic.code,
    ic.description,
    COALESCE(
        json_agg(
            json_build_object(
                'category', ec.code,
                'name', ec.name,
                'description', ec.description
            )
        ) FILTER (WHERE em.category_code IS NOT NULL),
        '[]'::json
    ) as elixhauser_categories
FROM icd10_codes ic
LEFT JOIN elixhauser_mappings em ON ic.code = em.icd10_code
LEFT JOIN elixhauser_categories ec ON em.category_code = ec.code
GROUP BY ic.code, ic.description;

-- View: Complete conversion from ICD-10 to ICD-9
CREATE VIEW v_icd10_to_icd9_complete AS
SELECT 
    ic.code as icd10_code,
    ic.description as icd10_description,
    m.icd9_code,
    m.approximate,
    m.no_map,
    m.combination,
    m.source
FROM icd10_codes ic
LEFT JOIN icd10_to_icd9_mapping m ON ic.code = m.icd10_code;

-- View: Complete conversion from ICD-9 to ICD-10
CREATE VIEW v_icd9_to_icd10_complete AS
SELECT 
    i9.code as icd9_code,
    m.icd10_code,
    ic.description as icd10_description,
    m.approximate,
    m.no_map,
    m.combination,
    m.source
FROM icd9_codes i9
LEFT JOIN icd9_to_icd10_mapping m ON i9.code = m.icd9_code
LEFT JOIN icd10_codes ic ON m.icd10_code = ic.code;

-- =====================================================
-- Useful Functions
-- =====================================================

-- Function: Get all codes in a family (e.g., E10 returns E10.0, E10.1, ...)
CREATE OR REPLACE FUNCTION get_code_family(prefix TEXT)
RETURNS TABLE(code VARCHAR(10), description TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT ic.code, ic.description
    FROM icd10_codes ic
    WHERE ic.code LIKE prefix || '%'
    ORDER BY ic.code;
END;
$$ LANGUAGE plpgsql;

-- Function: Get Charlson score for an ICD-10 code (with hierarchy)
CREATE OR REPLACE FUNCTION get_charlson_score_icd10(input_code VARCHAR(10))
RETURNS TABLE(
    condition VARCHAR(100),
    score INTEGER,
    match_type VARCHAR(10) -- 'exact' or 'prefix'
) AS $$
BEGIN
    -- Try exact match first
    RETURN QUERY
    SELECT 
        cm.condition_name,
        cm.score,
        'exact'::VARCHAR(10) as match_type
    FROM charlson_icd10_mappings cm
    WHERE cm.icd10_code = input_code;
    
    -- If no exact match, try prefix match
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            cm.condition_name,
            cm.score,
            'prefix'::VARCHAR(10) as match_type
        FROM charlson_icd10_mappings cm
        WHERE input_code LIKE cm.icd10_code || '%'
        AND cm.is_prefix = TRUE
        ORDER BY LENGTH(cm.icd10_code) DESC
        LIMIT 1;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: Get Charlson score for an ICD-9 code (with hierarchy)
CREATE OR REPLACE FUNCTION get_charlson_score_icd9(input_code VARCHAR(10))
RETURNS TABLE(
    condition VARCHAR(100),
    score INTEGER,
    match_type VARCHAR(10)
) AS $$
BEGIN
    -- Try exact match first
    RETURN QUERY
    SELECT 
        cm.condition_name,
        cm.score,
        'exact'::VARCHAR(10) as match_type
    FROM charlson_icd9_mappings cm
    WHERE cm.icd9_code = input_code;
    
    -- If no exact match, try prefix match
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            cm.condition_name,
            cm.score,
            'prefix'::VARCHAR(10) as match_type
        FROM charlson_icd9_mappings cm
        WHERE input_code LIKE cm.icd9_code || '%'
        AND cm.is_prefix = TRUE
        ORDER BY LENGTH(cm.icd9_code) DESC
        LIMIT 1;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Comments for documentation
-- =====================================================
COMMENT ON TABLE icd10_codes IS 'ICD-10-CM diagnosis codes with descriptions (version 2026)';
COMMENT ON TABLE icd9_codes IS 'ICD-9-CM diagnosis codes';
COMMENT ON TABLE icd10_to_icd9_mapping IS 'CMS General Equivalence Mappings from ICD-10 to ICD-9';
COMMENT ON TABLE icd9_to_icd10_mapping IS 'CMS General Equivalence Mappings from ICD-9 to ICD-10';
COMMENT ON TABLE elixhauser_categories IS 'Elixhauser comorbidity categories (31 conditions)';
COMMENT ON TABLE elixhauser_mappings IS 'ICD-10 codes mapped to Elixhauser comorbidity categories';
COMMENT ON TABLE charlson_categories IS 'Charlson Comorbidity Index categories with scores';
COMMENT ON TABLE charlson_icd10_mappings IS 'ICD-10 codes mapped to Charlson comorbidity conditions';
COMMENT ON TABLE charlson_icd9_mappings IS 'ICD-9 codes mapped to Charlson comorbidity conditions';
COMMENT ON TABLE metadata IS 'Metadata about data sources and versions';
