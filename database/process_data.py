"""
Script para procesar los archivos de mapeo ICD10/ICD9, Elixhauser y Charlson
y generar archivos JSON optimizados para la aplicación web.
"""

import pandas as pd
import json
import csv

def process_icd10_to_icd9():
    """Procesar el mapeo de ICD10 a ICD9"""
    print("Procesando ICD10 a ICD9...")
    icd10_to_icd9 = {}
    
    with open('icd10cmtoicd9gem.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            icd10 = row['icd10cm']
            icd9 = row['icd9cm']
            approximate = row['approximate']
            
            if icd10 not in icd10_to_icd9:
                icd10_to_icd9[icd10] = []
            
            icd10_to_icd9[icd10].append({
                'icd9': icd9,
                'approximate': approximate == '1'
            })
    
    with open('web/data/icd10_to_icd9.json', 'w', encoding='utf-8') as f:
        json.dump(icd10_to_icd9, f, ensure_ascii=False, indent=2)
    
    print(f"  ✓ Procesados {len(icd10_to_icd9)} códigos ICD10")

def process_icd9_to_icd10():
    """Procesar el mapeo de ICD9 a ICD10"""
    print("Procesando ICD9 a ICD10...")
    icd9_to_icd10 = {}
    
    with open('icd9toicd10cmgem.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            icd9 = row['icd9cm']
            icd10 = row['icd10cm']
            approximate = row['approximate']
            
            if icd9 not in icd9_to_icd10:
                icd9_to_icd10[icd9] = []
            
            icd9_to_icd10[icd9].append({
                'icd10': icd10,
                'approximate': approximate == '1'
            })
    
    with open('web/data/icd9_to_icd10.json', 'w', encoding='utf-8') as f:
        json.dump(icd9_to_icd10, f, ensure_ascii=False, indent=2)
    
    print(f"  ✓ Procesados {len(icd9_to_icd10)} códigos ICD9")

def process_icd10_codes():
    """Procesar las descripciones de códigos ICD10"""
    print("Procesando descripciones ICD10...")
    icd10_descriptions = {}
    
    with open('icd10cm_codes_2026.txt', 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                parts = line.strip().split(maxsplit=1)
                if len(parts) == 2:
                    code, description = parts
                    icd10_descriptions[code] = description
    
    with open('web/data/icd10_descriptions.json', 'w', encoding='utf-8') as f:
        json.dump(icd10_descriptions, f, ensure_ascii=False, indent=2)
    
    print(f"  ✓ Procesadas {len(icd10_descriptions)} descripciones ICD10")

def process_elixhauser():
    """Procesar las comorbilidades Elixhauser desde el archivo CMR"""
    print("Procesando comorbilidades Elixhauser...")
    
    # Read with header=0 to use first row as column names
    df = pd.read_excel('CMR-Reference-File-v2025-1.xlsx', sheet_name='DX_to_Comorb_Mapping', header=0)
    
    # Get the actual column names from the first row
    actual_headers = df.iloc[0]
    df = df[1:]  # Skip the header row
    df.columns = actual_headers
    
    # Now we have proper column names
    code_col = 'ICD-10-CM Diagnosis'
    desc_col = 'ICD-10-CM Code Description'
    
    elixhauser_data = {}
    
    # Get comorbidity column names (skip first 3: code, description, # comorbidities)
    comorbidity_cols = [col for col in df.columns if col not in [code_col, desc_col, '# Comorbidities'] and pd.notna(col)]
    
    for _, row in df.iterrows():
        code = row[code_col]
        description = row[desc_col]
        
        if pd.notna(code) and isinstance(code, str) and code.strip():
            comorbidities = []
            for comorb in comorbidity_cols:
                if pd.notna(row[comorb]) and (str(row[comorb]).strip() == '1' or row[comorb] == 1):
                    comorbidities.append(comorb)
            
            if comorbidities:
                elixhauser_data[code] = {
                    'description': str(description) if pd.notna(description) else '',
                    'comorbidities': comorbidities
                }
    
    with open('web/data/elixhauser.json', 'w', encoding='utf-8') as f:
        json.dump(elixhauser_data, f, ensure_ascii=False, indent=2)
    
    print(f"  ✓ Procesados {len(elixhauser_data)} códigos Elixhauser")

def create_charlson_mappings():
    """
    Crear mapeos de Charlson basados en el artículo PMC6684052
    CDMF Charlson Comorbidity Index
    """
    print("Creando mapeos de Charlson...")
    
    # Mapeo de Charlson con códigos ICD-10-CM (basado en CDMF CCI)
    charlson_icd10 = {
        # Myocardial Infarction (1 point)
        "I21": {"condition": "Myocardial Infarction", "score": 1},
        "I22": {"condition": "Myocardial Infarction", "score": 1},
        "I25.2": {"condition": "Old Myocardial Infarction", "score": 1},
        
        # Congestive Heart Failure (1 point)
        "I09.9": {"condition": "Congestive Heart Failure", "score": 1},
        "I11.0": {"condition": "Congestive Heart Failure", "score": 1},
        "I13.0": {"condition": "Congestive Heart Failure", "score": 1},
        "I13.2": {"condition": "Congestive Heart Failure", "score": 1},
        "I25.5": {"condition": "Congestive Heart Failure", "score": 1},
        "I42": {"condition": "Congestive Heart Failure", "score": 1},
        "I43": {"condition": "Congestive Heart Failure", "score": 1},
        "I50": {"condition": "Congestive Heart Failure", "score": 1},
        "P29.0": {"condition": "Congestive Heart Failure", "score": 1},
        
        # Peripheral Vascular Disease (1 point)
        "I70": {"condition": "Peripheral Vascular Disease", "score": 1},
        "I71": {"condition": "Peripheral Vascular Disease", "score": 1},
        "I73.1": {"condition": "Peripheral Vascular Disease", "score": 1},
        "I73.8": {"condition": "Peripheral Vascular Disease", "score": 1},
        "I73.9": {"condition": "Peripheral Vascular Disease", "score": 1},
        "I77.1": {"condition": "Peripheral Vascular Disease", "score": 1},
        "I79.0": {"condition": "Peripheral Vascular Disease", "score": 1},
        "I79.2": {"condition": "Peripheral Vascular Disease", "score": 1},
        "K55.1": {"condition": "Peripheral Vascular Disease", "score": 1},
        "K55.8": {"condition": "Peripheral Vascular Disease", "score": 1},
        "K55.9": {"condition": "Peripheral Vascular Disease", "score": 1},
        "Z95.8": {"condition": "Peripheral Vascular Disease", "score": 1},
        "Z95.9": {"condition": "Peripheral Vascular Disease", "score": 1},
        
        # Cerebrovascular Disease (1 point)
        "G45": {"condition": "Cerebrovascular Disease", "score": 1},
        "G46": {"condition": "Cerebrovascular Disease", "score": 1},
        "H34.0": {"condition": "Cerebrovascular Disease", "score": 1},
        "I60": {"condition": "Cerebrovascular Disease", "score": 1},
        "I61": {"condition": "Cerebrovascular Disease", "score": 1},
        "I62": {"condition": "Cerebrovascular Disease", "score": 1},
        "I63": {"condition": "Cerebrovascular Disease", "score": 1},
        "I64": {"condition": "Cerebrovascular Disease", "score": 1},
        "I65": {"condition": "Cerebrovascular Disease", "score": 1},
        "I66": {"condition": "Cerebrovascular Disease", "score": 1},
        "I67": {"condition": "Cerebrovascular Disease", "score": 1},
        "I68": {"condition": "Cerebrovascular Disease", "score": 1},
        "I69": {"condition": "Cerebrovascular Disease", "score": 1},
        
        # Dementia (1 point)
        "F00": {"condition": "Dementia", "score": 1},
        "F01": {"condition": "Dementia", "score": 1},
        "F02": {"condition": "Dementia", "score": 1},
        "F03": {"condition": "Dementia", "score": 1},
        "F04": {"condition": "Dementia", "score": 1},
        "F05.1": {"condition": "Dementia", "score": 1},
        "G30": {"condition": "Dementia", "score": 1},
        "G31.1": {"condition": "Dementia", "score": 1},
        
        # Chronic Pulmonary Disease (1 point)
        "I27.8": {"condition": "Chronic Pulmonary Disease", "score": 1},
        "I27.9": {"condition": "Chronic Pulmonary Disease", "score": 1},
        "J40": {"condition": "Chronic Pulmonary Disease", "score": 1},
        "J41": {"condition": "Chronic Pulmonary Disease", "score": 1},
        "J42": {"condition": "Chronic Pulmonary Disease", "score": 1},
        "J43": {"condition": "Chronic Pulmonary Disease", "score": 1},
        "J44": {"condition": "Chronic Pulmonary Disease", "score": 1},
        "J45": {"condition": "Chronic Pulmonary Disease", "score": 1},
        "J46": {"condition": "Chronic Pulmonary Disease", "score": 1},
        "J47": {"condition": "Chronic Pulmonary Disease", "score": 1},
        "J60": {"condition": "Chronic Pulmonary Disease", "score": 1},
        "J61": {"condition": "Chronic Pulmonary Disease", "score": 1},
        "J62": {"condition": "Chronic Pulmonary Disease", "score": 1},
        "J63": {"condition": "Chronic Pulmonary Disease", "score": 1},
        "J64": {"condition": "Chronic Pulmonary Disease", "score": 1},
        "J65": {"condition": "Chronic Pulmonary Disease", "score": 1},
        "J66": {"condition": "Chronic Pulmonary Disease", "score": 1},
        "J67": {"condition": "Chronic Pulmonary Disease", "score": 1},
        
        # Rheumatic Disease (1 point)
        "M05": {"condition": "Rheumatic Disease", "score": 1},
        "M06": {"condition": "Rheumatic Disease", "score": 1},
        "M31.5": {"condition": "Rheumatic Disease", "score": 1},
        "M32": {"condition": "Rheumatic Disease", "score": 1},
        "M33": {"condition": "Rheumatic Disease", "score": 1},
        "M34": {"condition": "Rheumatic Disease", "score": 1},
        "M35.1": {"condition": "Rheumatic Disease", "score": 1},
        "M35.3": {"condition": "Rheumatic Disease", "score": 1},
        "M36.0": {"condition": "Rheumatic Disease", "score": 1},
        
        # Peptic Ulcer Disease (1 point)
        "K25": {"condition": "Peptic Ulcer Disease", "score": 1},
        "K26": {"condition": "Peptic Ulcer Disease", "score": 1},
        "K27": {"condition": "Peptic Ulcer Disease", "score": 1},
        "K28": {"condition": "Peptic Ulcer Disease", "score": 1},
        
        # Mild Liver Disease (1 point)
        "B18": {"condition": "Mild Liver Disease", "score": 1},
        "K70.0": {"condition": "Mild Liver Disease", "score": 1},
        "K70.1": {"condition": "Mild Liver Disease", "score": 1},
        "K70.2": {"condition": "Mild Liver Disease", "score": 1},
        "K70.3": {"condition": "Mild Liver Disease", "score": 1},
        "K70.9": {"condition": "Mild Liver Disease", "score": 1},
        "K71.3": {"condition": "Mild Liver Disease", "score": 1},
        "K71.4": {"condition": "Mild Liver Disease", "score": 1},
        "K71.5": {"condition": "Mild Liver Disease", "score": 1},
        "K71.7": {"condition": "Mild Liver Disease", "score": 1},
        "K73": {"condition": "Mild Liver Disease", "score": 1},
        "K74": {"condition": "Mild Liver Disease", "score": 1},
        "K76.0": {"condition": "Mild Liver Disease", "score": 1},
        "K76.2": {"condition": "Mild Liver Disease", "score": 1},
        "K76.3": {"condition": "Mild Liver Disease", "score": 1},
        "K76.4": {"condition": "Mild Liver Disease", "score": 1},
        "K76.8": {"condition": "Mild Liver Disease", "score": 1},
        "K76.9": {"condition": "Mild Liver Disease", "score": 1},
        "Z94.4": {"condition": "Mild Liver Disease", "score": 1},
        
        # Diabetes without chronic complications (1 point)
        "E08.0": {"condition": "Diabetes without Complications", "score": 1},
        "E08.1": {"condition": "Diabetes without Complications", "score": 1},
        "E09.0": {"condition": "Diabetes without Complications", "score": 1},
        "E09.1": {"condition": "Diabetes without Complications", "score": 1},
        "E10.0": {"condition": "Diabetes without Complications", "score": 1},
        "E10.1": {"condition": "Diabetes without Complications", "score": 1},
        "E11.0": {"condition": "Diabetes without Complications", "score": 1},
        "E11.1": {"condition": "Diabetes without Complications", "score": 1},
        "E13.0": {"condition": "Diabetes without Complications", "score": 1},
        "E13.1": {"condition": "Diabetes without Complications", "score": 1},
        
        # Diabetes with chronic complications (2 points)
        "E08.2": {"condition": "Diabetes with Complications", "score": 2},
        "E08.3": {"condition": "Diabetes with Complications", "score": 2},
        "E08.4": {"condition": "Diabetes with Complications", "score": 2},
        "E08.5": {"condition": "Diabetes with Complications", "score": 2},
        "E08.6": {"condition": "Diabetes with Complications", "score": 2},
        "E08.7": {"condition": "Diabetes with Complications", "score": 2},
        "E08.8": {"condition": "Diabetes with Complications", "score": 2},
        "E08.9": {"condition": "Diabetes with Complications", "score": 2},
        "E09.2": {"condition": "Diabetes with Complications", "score": 2},
        "E09.3": {"condition": "Diabetes with Complications", "score": 2},
        "E09.4": {"condition": "Diabetes with Complications", "score": 2},
        "E09.5": {"condition": "Diabetes with Complications", "score": 2},
        "E09.6": {"condition": "Diabetes with Complications", "score": 2},
        "E09.7": {"condition": "Diabetes with Complications", "score": 2},
        "E09.8": {"condition": "Diabetes with Complications", "score": 2},
        "E09.9": {"condition": "Diabetes with Complications", "score": 2},
        "E10.2": {"condition": "Diabetes with Complications", "score": 2},
        "E10.3": {"condition": "Diabetes with Complications", "score": 2},
        "E10.4": {"condition": "Diabetes with Complications", "score": 2},
        "E10.5": {"condition": "Diabetes with Complications", "score": 2},
        "E10.6": {"condition": "Diabetes with Complications", "score": 2},
        "E10.7": {"condition": "Diabetes with Complications", "score": 2},
        "E10.8": {"condition": "Diabetes with Complications", "score": 2},
        "E10.9": {"condition": "Diabetes with Complications", "score": 2},
        "E11.2": {"condition": "Diabetes with Complications", "score": 2},
        "E11.3": {"condition": "Diabetes with Complications", "score": 2},
        "E11.4": {"condition": "Diabetes with Complications", "score": 2},
        "E11.5": {"condition": "Diabetes with Complications", "score": 2},
        "E11.6": {"condition": "Diabetes with Complications", "score": 2},
        "E11.7": {"condition": "Diabetes with Complications", "score": 2},
        "E11.8": {"condition": "Diabetes with Complications", "score": 2},
        "E11.9": {"condition": "Diabetes with Complications", "score": 2},
        "E13.2": {"condition": "Diabetes with Complications", "score": 2},
        "E13.3": {"condition": "Diabetes with Complications", "score": 2},
        "E13.4": {"condition": "Diabetes with Complications", "score": 2},
        "E13.5": {"condition": "Diabetes with Complications", "score": 2},
        "E13.6": {"condition": "Diabetes with Complications", "score": 2},
        "E13.7": {"condition": "Diabetes with Complications", "score": 2},
        "E13.8": {"condition": "Diabetes with Complications", "score": 2},
        "E13.9": {"condition": "Diabetes with Complications", "score": 2},
        
        # Hemiplegia or Paraplegia (2 points)
        "G04.1": {"condition": "Hemiplegia or Paraplegia", "score": 2},
        "G11.4": {"condition": "Hemiplegia or Paraplegia", "score": 2},
        "G80.1": {"condition": "Hemiplegia or Paraplegia", "score": 2},
        "G80.2": {"condition": "Hemiplegia or Paraplegia", "score": 2},
        "G81": {"condition": "Hemiplegia or Paraplegia", "score": 2},
        "G82": {"condition": "Hemiplegia or Paraplegia", "score": 2},
        "G83.0": {"condition": "Hemiplegia or Paraplegia", "score": 2},
        "G83.1": {"condition": "Hemiplegia or Paraplegia", "score": 2},
        "G83.2": {"condition": "Hemiplegia or Paraplegia", "score": 2},
        "G83.3": {"condition": "Hemiplegia or Paraplegia", "score": 2},
        "G83.4": {"condition": "Hemiplegia or Paraplegia", "score": 2},
        "G83.9": {"condition": "Hemiplegia or Paraplegia", "score": 2},
        
        # Renal Disease (2 points)
        "I12.0": {"condition": "Renal Disease", "score": 2},
        "I13.1": {"condition": "Renal Disease", "score": 2},
        "N03.2": {"condition": "Renal Disease", "score": 2},
        "N03.3": {"condition": "Renal Disease", "score": 2},
        "N03.4": {"condition": "Renal Disease", "score": 2},
        "N03.5": {"condition": "Renal Disease", "score": 2},
        "N03.6": {"condition": "Renal Disease", "score": 2},
        "N03.7": {"condition": "Renal Disease", "score": 2},
        "N05.2": {"condition": "Renal Disease", "score": 2},
        "N05.3": {"condition": "Renal Disease", "score": 2},
        "N05.4": {"condition": "Renal Disease", "score": 2},
        "N05.5": {"condition": "Renal Disease", "score": 2},
        "N05.6": {"condition": "Renal Disease", "score": 2},
        "N05.7": {"condition": "Renal Disease", "score": 2},
        "N18": {"condition": "Renal Disease", "score": 2},
        "N19": {"condition": "Renal Disease", "score": 2},
        "N25.0": {"condition": "Renal Disease", "score": 2},
        "Z49.0": {"condition": "Renal Disease", "score": 2},
        "Z49.1": {"condition": "Renal Disease", "score": 2},
        "Z49.2": {"condition": "Renal Disease", "score": 2},
        "Z94.0": {"condition": "Renal Disease", "score": 2},
        "Z99.2": {"condition": "Renal Disease", "score": 2},
        
        # Any Malignancy (2 points)
        "C00": {"condition": "Any Malignancy", "score": 2},
        "C01": {"condition": "Any Malignancy", "score": 2},
        "C02": {"condition": "Any Malignancy", "score": 2},
        "C03": {"condition": "Any Malignancy", "score": 2},
        "C04": {"condition": "Any Malignancy", "score": 2},
        "C05": {"condition": "Any Malignancy", "score": 2},
        "C06": {"condition": "Any Malignancy", "score": 2},
        "C07": {"condition": "Any Malignancy", "score": 2},
        "C08": {"condition": "Any Malignancy", "score": 2},
        "C09": {"condition": "Any Malignancy", "score": 2},
        "C10": {"condition": "Any Malignancy", "score": 2},
        "C11": {"condition": "Any Malignancy", "score": 2},
        "C12": {"condition": "Any Malignancy", "score": 2},
        "C13": {"condition": "Any Malignancy", "score": 2},
        "C14": {"condition": "Any Malignancy", "score": 2},
        "C15": {"condition": "Any Malignancy", "score": 2},
        "C16": {"condition": "Any Malignancy", "score": 2},
        "C17": {"condition": "Any Malignancy", "score": 2},
        "C18": {"condition": "Any Malignancy", "score": 2},
        "C19": {"condition": "Any Malignancy", "score": 2},
        "C20": {"condition": "Any Malignancy", "score": 2},
        "C21": {"condition": "Any Malignancy", "score": 2},
        "C22": {"condition": "Any Malignancy", "score": 2},
        "C23": {"condition": "Any Malignancy", "score": 2},
        "C24": {"condition": "Any Malignancy", "score": 2},
        "C25": {"condition": "Any Malignancy", "score": 2},
        "C26": {"condition": "Any Malignancy", "score": 2},
        "C30": {"condition": "Any Malignancy", "score": 2},
        "C31": {"condition": "Any Malignancy", "score": 2},
        "C32": {"condition": "Any Malignancy", "score": 2},
        "C33": {"condition": "Any Malignancy", "score": 2},
        "C34": {"condition": "Any Malignancy", "score": 2},
        "C37": {"condition": "Any Malignancy", "score": 2},
        "C38": {"condition": "Any Malignancy", "score": 2},
        "C39": {"condition": "Any Malignancy", "score": 2},
        "C40": {"condition": "Any Malignancy", "score": 2},
        "C41": {"condition": "Any Malignancy", "score": 2},
        "C43": {"condition": "Any Malignancy", "score": 2},
        "C45": {"condition": "Any Malignancy", "score": 2},
        "C46": {"condition": "Any Malignancy", "score": 2},
        "C47": {"condition": "Any Malignancy", "score": 2},
        "C48": {"condition": "Any Malignancy", "score": 2},
        "C49": {"condition": "Any Malignancy", "score": 2},
        "C50": {"condition": "Any Malignancy", "score": 2},
        "C51": {"condition": "Any Malignancy", "score": 2},
        "C52": {"condition": "Any Malignancy", "score": 2},
        "C53": {"condition": "Any Malignancy", "score": 2},
        "C54": {"condition": "Any Malignancy", "score": 2},
        "C55": {"condition": "Any Malignancy", "score": 2},
        "C56": {"condition": "Any Malignancy", "score": 2},
        "C57": {"condition": "Any Malignancy", "score": 2},
        "C58": {"condition": "Any Malignancy", "score": 2},
        "C60": {"condition": "Any Malignancy", "score": 2},
        "C61": {"condition": "Any Malignancy", "score": 2},
        "C62": {"condition": "Any Malignancy", "score": 2},
        "C63": {"condition": "Any Malignancy", "score": 2},
        "C64": {"condition": "Any Malignancy", "score": 2},
        "C65": {"condition": "Any Malignancy", "score": 2},
        "C66": {"condition": "Any Malignancy", "score": 2},
        "C67": {"condition": "Any Malignancy", "score": 2},
        "C68": {"condition": "Any Malignancy", "score": 2},
        "C69": {"condition": "Any Malignancy", "score": 2},
        "C70": {"condition": "Any Malignancy", "score": 2},
        "C71": {"condition": "Any Malignancy", "score": 2},
        "C72": {"condition": "Any Malignancy", "score": 2},
        "C73": {"condition": "Any Malignancy", "score": 2},
        "C74": {"condition": "Any Malignancy", "score": 2},
        "C75": {"condition": "Any Malignancy", "score": 2},
        "C76": {"condition": "Any Malignancy", "score": 2},
        "C81": {"condition": "Any Malignancy", "score": 2},
        "C82": {"condition": "Any Malignancy", "score": 2},
        "C83": {"condition": "Any Malignancy", "score": 2},
        "C84": {"condition": "Any Malignancy", "score": 2},
        "C85": {"condition": "Any Malignancy", "score": 2},
        "C86": {"condition": "Any Malignancy", "score": 2},
        "C88": {"condition": "Any Malignancy", "score": 2},
        "C90": {"condition": "Any Malignancy", "score": 2},
        "C91": {"condition": "Any Malignancy", "score": 2},
        "C92": {"condition": "Any Malignancy", "score": 2},
        "C93": {"condition": "Any Malignancy", "score": 2},
        "C94": {"condition": "Any Malignancy", "score": 2},
        "C95": {"condition": "Any Malignancy", "score": 2},
        "C96": {"condition": "Any Malignancy", "score": 2},
        
        # Moderate or Severe Liver Disease (3 points)
        "I85.0": {"condition": "Moderate or Severe Liver Disease", "score": 3},
        "I85.9": {"condition": "Moderate or Severe Liver Disease", "score": 3},
        "I86.4": {"condition": "Moderate or Severe Liver Disease", "score": 3},
        "I98.2": {"condition": "Moderate or Severe Liver Disease", "score": 3},
        "K70.4": {"condition": "Moderate or Severe Liver Disease", "score": 3},
        "K71.1": {"condition": "Moderate or Severe Liver Disease", "score": 3},
        "K72": {"condition": "Moderate or Severe Liver Disease", "score": 3},
        "K76.5": {"condition": "Moderate or Severe Liver Disease", "score": 3},
        "K76.6": {"condition": "Moderate or Severe Liver Disease", "score": 3},
        "K76.7": {"condition": "Moderate or Severe Liver Disease", "score": 3},
        
        # Metastatic Solid Tumor (6 points)
        "C77": {"condition": "Metastatic Solid Tumor", "score": 6},
        "C78": {"condition": "Metastatic Solid Tumor", "score": 6},
        "C79": {"condition": "Metastatic Solid Tumor", "score": 6},
        "C80": {"condition": "Metastatic Solid Tumor", "score": 6},
        
        # AIDS/HIV (6 points)
        "B20": {"condition": "AIDS/HIV", "score": 6},
    }
    
    # Guardar mapeo ICD-10
    with open('web/data/charlson_icd10.json', 'w', encoding='utf-8') as f:
        json.dump(charlson_icd10, f, ensure_ascii=False, indent=2)
    
    print(f"  ✓ Creados mapeos Charlson ICD-10 ({len(charlson_icd10)} códigos)")
    
    # Mapeo de Charlson con códigos ICD-9-CM
    charlson_icd9 = {
        # Myocardial Infarction (1 point)
        "410": {"condition": "Myocardial Infarction", "score": 1},
        "412": {"condition": "Old Myocardial Infarction", "score": 1},
        
        # Congestive Heart Failure (1 point)
        "398.91": {"condition": "Congestive Heart Failure", "score": 1},
        "402.01": {"condition": "Congestive Heart Failure", "score": 1},
        "402.11": {"condition": "Congestive Heart Failure", "score": 1},
        "402.91": {"condition": "Congestive Heart Failure", "score": 1},
        "404.01": {"condition": "Congestive Heart Failure", "score": 1},
        "404.03": {"condition": "Congestive Heart Failure", "score": 1},
        "404.11": {"condition": "Congestive Heart Failure", "score": 1},
        "404.13": {"condition": "Congestive Heart Failure", "score": 1},
        "404.91": {"condition": "Congestive Heart Failure", "score": 1},
        "404.93": {"condition": "Congestive Heart Failure", "score": 1},
        "425": {"condition": "Congestive Heart Failure", "score": 1},
        "428": {"condition": "Congestive Heart Failure", "score": 1},
        
        # Peripheral Vascular Disease (1 point)
        "440": {"condition": "Peripheral Vascular Disease", "score": 1},
        "441": {"condition": "Peripheral Vascular Disease", "score": 1},
        "442": {"condition": "Peripheral Vascular Disease", "score": 1},
        "443": {"condition": "Peripheral Vascular Disease", "score": 1},
        "447.1": {"condition": "Peripheral Vascular Disease", "score": 1},
        "557.1": {"condition": "Peripheral Vascular Disease", "score": 1},
        "557.9": {"condition": "Peripheral Vascular Disease", "score": 1},
        "V43.4": {"condition": "Peripheral Vascular Disease", "score": 1},
        
        # Cerebrovascular Disease (1 point)
        "362.34": {"condition": "Cerebrovascular Disease", "score": 1},
        "430": {"condition": "Cerebrovascular Disease", "score": 1},
        "431": {"condition": "Cerebrovascular Disease", "score": 1},
        "432": {"condition": "Cerebrovascular Disease", "score": 1},
        "433": {"condition": "Cerebrovascular Disease", "score": 1},
        "434": {"condition": "Cerebrovascular Disease", "score": 1},
        "435": {"condition": "Cerebrovascular Disease", "score": 1},
        "436": {"condition": "Cerebrovascular Disease", "score": 1},
        "437": {"condition": "Cerebrovascular Disease", "score": 1},
        "438": {"condition": "Cerebrovascular Disease", "score": 1},
        
        # Dementia (1 point)
        "290": {"condition": "Dementia", "score": 1},
        "294.1": {"condition": "Dementia", "score": 1},
        "331.2": {"condition": "Dementia", "score": 1},
        
        # Chronic Pulmonary Disease (1 point)
        "416.8": {"condition": "Chronic Pulmonary Disease", "score": 1},
        "416.9": {"condition": "Chronic Pulmonary Disease", "score": 1},
        "490": {"condition": "Chronic Pulmonary Disease", "score": 1},
        "491": {"condition": "Chronic Pulmonary Disease", "score": 1},
        "492": {"condition": "Chronic Pulmonary Disease", "score": 1},
        "493": {"condition": "Chronic Pulmonary Disease", "score": 1},
        "494": {"condition": "Chronic Pulmonary Disease", "score": 1},
        "495": {"condition": "Chronic Pulmonary Disease", "score": 1},
        "496": {"condition": "Chronic Pulmonary Disease", "score": 1},
        "500": {"condition": "Chronic Pulmonary Disease", "score": 1},
        "501": {"condition": "Chronic Pulmonary Disease", "score": 1},
        "502": {"condition": "Chronic Pulmonary Disease", "score": 1},
        "503": {"condition": "Chronic Pulmonary Disease", "score": 1},
        "504": {"condition": "Chronic Pulmonary Disease", "score": 1},
        "505": {"condition": "Chronic Pulmonary Disease", "score": 1},
        "506.4": {"condition": "Chronic Pulmonary Disease", "score": 1},
        
        # Rheumatic Disease (1 point)
        "446.5": {"condition": "Rheumatic Disease", "score": 1},
        "710.0": {"condition": "Rheumatic Disease", "score": 1},
        "710.1": {"condition": "Rheumatic Disease", "score": 1},
        "710.2": {"condition": "Rheumatic Disease", "score": 1},
        "710.3": {"condition": "Rheumatic Disease", "score": 1},
        "710.4": {"condition": "Rheumatic Disease", "score": 1},
        "714.0": {"condition": "Rheumatic Disease", "score": 1},
        "714.1": {"condition": "Rheumatic Disease", "score": 1},
        "714.2": {"condition": "Rheumatic Disease", "score": 1},
        "714.8": {"condition": "Rheumatic Disease", "score": 1},
        "725": {"condition": "Rheumatic Disease", "score": 1},
        
        # Peptic Ulcer Disease (1 point)
        "531": {"condition": "Peptic Ulcer Disease", "score": 1},
        "532": {"condition": "Peptic Ulcer Disease", "score": 1},
        "533": {"condition": "Peptic Ulcer Disease", "score": 1},
        "534": {"condition": "Peptic Ulcer Disease", "score": 1},
        
        # Mild Liver Disease (1 point)
        "070.22": {"condition": "Mild Liver Disease", "score": 1},
        "070.23": {"condition": "Mild Liver Disease", "score": 1},
        "070.32": {"condition": "Mild Liver Disease", "score": 1},
        "070.33": {"condition": "Mild Liver Disease", "score": 1},
        "070.44": {"condition": "Mild Liver Disease", "score": 1},
        "070.54": {"condition": "Mild Liver Disease", "score": 1},
        "070.6": {"condition": "Mild Liver Disease", "score": 1},
        "070.9": {"condition": "Mild Liver Disease", "score": 1},
        "571.0": {"condition": "Mild Liver Disease", "score": 1},
        "571.2": {"condition": "Mild Liver Disease", "score": 1},
        "571.3": {"condition": "Mild Liver Disease", "score": 1},
        "571.4": {"condition": "Mild Liver Disease", "score": 1},
        "571.5": {"condition": "Mild Liver Disease", "score": 1},
        "571.6": {"condition": "Mild Liver Disease", "score": 1},
        "571.8": {"condition": "Mild Liver Disease", "score": 1},
        "571.9": {"condition": "Mild Liver Disease", "score": 1},
        "V42.7": {"condition": "Mild Liver Disease", "score": 1},
        
        # Diabetes without chronic complications (1 point)
        "250.0": {"condition": "Diabetes without Complications", "score": 1},
        "250.1": {"condition": "Diabetes without Complications", "score": 1},
        "250.2": {"condition": "Diabetes without Complications", "score": 1},
        "250.3": {"condition": "Diabetes without Complications", "score": 1},
        
        # Diabetes with chronic complications (2 points)
        "250.4": {"condition": "Diabetes with Complications", "score": 2},
        "250.5": {"condition": "Diabetes with Complications", "score": 2},
        "250.6": {"condition": "Diabetes with Complications", "score": 2},
        "250.7": {"condition": "Diabetes with Complications", "score": 2},
        "250.8": {"condition": "Diabetes with Complications", "score": 2},
        "250.9": {"condition": "Diabetes with Complications", "score": 2},
        
        # Hemiplegia or Paraplegia (2 points)
        "334.1": {"condition": "Hemiplegia or Paraplegia", "score": 2},
        "342": {"condition": "Hemiplegia or Paraplegia", "score": 2},
        "343": {"condition": "Hemiplegia or Paraplegia", "score": 2},
        "344.0": {"condition": "Hemiplegia or Paraplegia", "score": 2},
        "344.1": {"condition": "Hemiplegia or Paraplegia", "score": 2},
        "344.2": {"condition": "Hemiplegia or Paraplegia", "score": 2},
        "344.3": {"condition": "Hemiplegia or Paraplegia", "score": 2},
        "344.4": {"condition": "Hemiplegia or Paraplegia", "score": 2},
        "344.5": {"condition": "Hemiplegia or Paraplegia", "score": 2},
        "344.6": {"condition": "Hemiplegia or Paraplegia", "score": 2},
        "344.9": {"condition": "Hemiplegia or Paraplegia", "score": 2},
        
        # Renal Disease (2 points)
        "403.01": {"condition": "Renal Disease", "score": 2},
        "403.11": {"condition": "Renal Disease", "score": 2},
        "403.91": {"condition": "Renal Disease", "score": 2},
        "404.02": {"condition": "Renal Disease", "score": 2},
        "404.03": {"condition": "Renal Disease", "score": 2},
        "404.12": {"condition": "Renal Disease", "score": 2},
        "404.13": {"condition": "Renal Disease", "score": 2},
        "404.92": {"condition": "Renal Disease", "score": 2},
        "404.93": {"condition": "Renal Disease", "score": 2},
        "582": {"condition": "Renal Disease", "score": 2},
        "583": {"condition": "Renal Disease", "score": 2},
        "585": {"condition": "Renal Disease", "score": 2},
        "586": {"condition": "Renal Disease", "score": 2},
        "588.0": {"condition": "Renal Disease", "score": 2},
        "V42.0": {"condition": "Renal Disease", "score": 2},
        "V45.1": {"condition": "Renal Disease", "score": 2},
        "V56": {"condition": "Renal Disease", "score": 2},
        
        # Any Malignancy (2 points)
        "140": {"condition": "Any Malignancy", "score": 2},
        "141": {"condition": "Any Malignancy", "score": 2},
        "142": {"condition": "Any Malignancy", "score": 2},
        "143": {"condition": "Any Malignancy", "score": 2},
        "144": {"condition": "Any Malignancy", "score": 2},
        "145": {"condition": "Any Malignancy", "score": 2},
        "146": {"condition": "Any Malignancy", "score": 2},
        "147": {"condition": "Any Malignancy", "score": 2},
        "148": {"condition": "Any Malignancy", "score": 2},
        "149": {"condition": "Any Malignancy", "score": 2},
        "150": {"condition": "Any Malignancy", "score": 2},
        "151": {"condition": "Any Malignancy", "score": 2},
        "152": {"condition": "Any Malignancy", "score": 2},
        "153": {"condition": "Any Malignancy", "score": 2},
        "154": {"condition": "Any Malignancy", "score": 2},
        "155": {"condition": "Any Malignancy", "score": 2},
        "156": {"condition": "Any Malignancy", "score": 2},
        "157": {"condition": "Any Malignancy", "score": 2},
        "158": {"condition": "Any Malignancy", "score": 2},
        "159": {"condition": "Any Malignancy", "score": 2},
        "160": {"condition": "Any Malignancy", "score": 2},
        "161": {"condition": "Any Malignancy", "score": 2},
        "162": {"condition": "Any Malignancy", "score": 2},
        "163": {"condition": "Any Malignancy", "score": 2},
        "164": {"condition": "Any Malignancy", "score": 2},
        "165": {"condition": "Any Malignancy", "score": 2},
        "170": {"condition": "Any Malignancy", "score": 2},
        "171": {"condition": "Any Malignancy", "score": 2},
        "172": {"condition": "Any Malignancy", "score": 2},
        "174": {"condition": "Any Malignancy", "score": 2},
        "175": {"condition": "Any Malignancy", "score": 2},
        "176": {"condition": "Any Malignancy", "score": 2},
        "179": {"condition": "Any Malignancy", "score": 2},
        "180": {"condition": "Any Malignancy", "score": 2},
        "181": {"condition": "Any Malignancy", "score": 2},
        "182": {"condition": "Any Malignancy", "score": 2},
        "183": {"condition": "Any Malignancy", "score": 2},
        "184": {"condition": "Any Malignancy", "score": 2},
        "185": {"condition": "Any Malignancy", "score": 2},
        "186": {"condition": "Any Malignancy", "score": 2},
        "187": {"condition": "Any Malignancy", "score": 2},
        "188": {"condition": "Any Malignancy", "score": 2},
        "189": {"condition": "Any Malignancy", "score": 2},
        "190": {"condition": "Any Malignancy", "score": 2},
        "191": {"condition": "Any Malignancy", "score": 2},
        "192": {"condition": "Any Malignancy", "score": 2},
        "193": {"condition": "Any Malignancy", "score": 2},
        "194": {"condition": "Any Malignancy", "score": 2},
        "195": {"condition": "Any Malignancy", "score": 2},
        "200": {"condition": "Any Malignancy", "score": 2},
        "201": {"condition": "Any Malignancy", "score": 2},
        "202": {"condition": "Any Malignancy", "score": 2},
        "203": {"condition": "Any Malignancy", "score": 2},
        "204": {"condition": "Any Malignancy", "score": 2},
        "205": {"condition": "Any Malignancy", "score": 2},
        "206": {"condition": "Any Malignancy", "score": 2},
        "207": {"condition": "Any Malignancy", "score": 2},
        "208": {"condition": "Any Malignancy", "score": 2},
        
        # Moderate or Severe Liver Disease (3 points)
        "456.0": {"condition": "Moderate or Severe Liver Disease", "score": 3},
        "456.1": {"condition": "Moderate or Severe Liver Disease", "score": 3},
        "456.2": {"condition": "Moderate or Severe Liver Disease", "score": 3},
        "572.2": {"condition": "Moderate or Severe Liver Disease", "score": 3},
        "572.3": {"condition": "Moderate or Severe Liver Disease", "score": 3},
        "572.4": {"condition": "Moderate or Severe Liver Disease", "score": 3},
        
        # Metastatic Solid Tumor (6 points)
        "196": {"condition": "Metastatic Solid Tumor", "score": 6},
        "197": {"condition": "Metastatic Solid Tumor", "score": 6},
        "198": {"condition": "Metastatic Solid Tumor", "score": 6},
        "199.0": {"condition": "Metastatic Solid Tumor", "score": 6},
        "199.1": {"condition": "Metastatic Solid Tumor", "score": 6},
        
        # AIDS/HIV (6 points)
        "042": {"condition": "AIDS/HIV", "score": 6},
    }
    
    # Guardar mapeo ICD-9
    with open('web/data/charlson_icd9.json', 'w', encoding='utf-8') as f:
        json.dump(charlson_icd9, f, ensure_ascii=False, indent=2)
    
    print(f"  OK Creados mapeos Charlson ICD-9 ({len(charlson_icd9)} codigos)")

def main():
    """Función principal para procesar todos los datos"""
    import os
    
    # Crear directorio de salida
    os.makedirs('web/data', exist_ok=True)
    
    print("\n=== Procesando archivos de datos ===\n")
    
    process_icd10_to_icd9()
    process_icd9_to_icd10()
    process_icd10_codes()
    process_elixhauser()
    create_charlson_mappings()
    
    print("\n=== ✓ Procesamiento completado ===\n")
    print("Archivos JSON generados en: web/data/")

if __name__ == "__main__":
    main()

