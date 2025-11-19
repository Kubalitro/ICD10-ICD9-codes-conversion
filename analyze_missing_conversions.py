"""
Script para analizar codigos ICD-10 que NO tienen conversion a ICD-9
y viceversa, identificando patrones y generando reporte detallado.
"""

import csv
import os
import json
import sys
from collections import defaultdict

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Configuración
ICD10_CODES_FILE = "icd10cm_codes_2026.txt"
ICD9_CODES_FILE = "icd10cm_codes_2026.txt"  # Necesitamos el archivo de ICD-9
ICD10_TO_ICD9_CSV = "icd10cmtoicd9gem.csv"
ICD9_TO_ICD10_CSV = "icd9toicd10cmgem.csv"

def load_icd10_codes():
    """Cargar todos los códigos ICD-10 del archivo de descripciones"""
    codes = {}
    if not os.path.exists(ICD10_CODES_FILE):
        print(f"⚠️  Archivo no encontrado: {ICD10_CODES_FILE}")
        return codes
    
    with open(ICD10_CODES_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                # Formato: "A000    Description text"
                parts = line.split(None, 1)
                if len(parts) >= 1:
                    code = parts[0].strip()
                    description = parts[1].strip() if len(parts) > 1 else ""
                    codes[code] = description
    
    return codes

def load_mapping_csv(csv_file, source_col, target_col):
    """Cargar mapeos desde CSV"""
    mappings = defaultdict(list)
    
    if not os.path.exists(csv_file):
        print(f"⚠️  Archivo no encontrado: {csv_file}")
        return mappings
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            source = row[source_col].strip()
            target = row[target_col].strip()
            mappings[source].append(target)
    
    return mappings

def analyze_missing_conversions():
    """Análisis principal"""
    
    print("=" * 80)
    print("ANÁLISIS DE CONVERSIONES FALTANTES - ICD-10 ↔ ICD-9")
    print("=" * 80)
    print()
    
    # 1. Cargar todos los códigos ICD-10
    print("📂 Cargando códigos ICD-10...")
    icd10_codes = load_icd10_codes()
    print(f"   ✅ {len(icd10_codes):,} códigos ICD-10 encontrados")
    
    # 2. Cargar mapeos ICD-10 → ICD-9
    print("\n📂 Cargando mapeos ICD-10 → ICD-9...")
    icd10_to_icd9 = load_mapping_csv(ICD10_TO_ICD9_CSV, 'icd10cm', 'icd9cm')
    print(f"   ✅ {len(icd10_to_icd9):,} códigos ICD-10 con mapeo a ICD-9")
    
    # 3. Cargar mapeos ICD-9 → ICD-10
    print("\n📂 Cargando mapeos ICD-9 → ICD-10...")
    icd9_to_icd10 = load_mapping_csv(ICD9_TO_ICD10_CSV, 'icd9cm', 'icd10cm')
    print(f"   ✅ {len(icd9_to_icd10):,} códigos ICD-9 con mapeo a ICD-10")
    
    # 4. Identificar códigos ICD-10 sin conversión
    print("\n" + "=" * 80)
    print("ANÁLISIS: Códigos ICD-10 SIN conversión a ICD-9")
    print("=" * 80)
    
    missing_forward = []
    for code in icd10_codes:
        if code not in icd10_to_icd9:
            missing_forward.append({
                'code': code,
                'description': icd10_codes[code]
            })
    
    print(f"\n🔴 Total: {len(missing_forward):,} códigos ICD-10 sin conversión")
    print(f"   ({len(missing_forward) / len(icd10_codes) * 100:.1f}% del total)")
    
    # 5. Analizar patrones por familia
    families = defaultdict(list)
    for item in missing_forward:
        # Extraer prefijo (primeros 3 caracteres)
        prefix = item['code'][:3]
        families[prefix].append(item)
    
    print(f"\n📊 Familias afectadas: {len(families)}")
    
    # Top 20 familias con más códigos faltantes
    top_families = sorted(families.items(), key=lambda x: len(x[1]), reverse=True)[:20]
    
    print("\n🔝 Top 20 familias con más códigos sin conversión:")
    print("-" * 80)
    for prefix, codes in top_families:
        first_desc = codes[0]['description'][:50] + "..." if len(codes[0]['description']) > 50 else codes[0]['description']
        print(f"   {prefix}: {len(codes):4} códigos  - {first_desc}")
    
    # 6. Ejemplos específicos
    print("\n📋 Ejemplos de códigos sin conversión:")
    print("-" * 80)
    for item in missing_forward[:10]:
        print(f"   {item['code']:<10} → {item['description'][:60]}")
    
    # 7. Códigos clínicamente importantes sin conversión
    important_prefixes = ['I21', 'I50', 'E10', 'E11', 'J44', 'N18', 'C50']
    print("\n⚠️  Códigos clínicamente importantes sin conversión:")
    print("-" * 80)
    
    important_missing = []
    for item in missing_forward:
        prefix = item['code'][:3]
        if prefix in important_prefixes:
            important_missing.append(item)
    
    if important_missing:
        for item in important_missing[:20]:
            print(f"   ❗ {item['code']:<10} → {item['description']}")
    else:
        print("   ✅ Ningún código importante sin conversión detectado")
    
    # 8. Verificar conversión inversa
    print("\n" + "=" * 80)
    print("ANÁLISIS: Verificación de conversión bidireccional")
    print("=" * 80)
    
    # Códigos que pueden convertirse ICD-10→ICD-9 pero no ICD-9→ICD-10
    unidirectional = []
    for icd10_code in icd10_to_icd9:
        icd9_targets = icd10_to_icd9[icd10_code]
        # Verificar si todos los targets pueden volver
        for icd9_code in icd9_targets:
            if icd9_code not in icd9_to_icd10:
                unidirectional.append({
                    'icd10': icd10_code,
                    'icd9': icd9_code,
                    'direction': 'forward_only'
                })
    
    print(f"\n⚠️  Conversiones unidireccionales: {len(unidirectional)}")
    if unidirectional:
        print("\n   Ejemplos (ICD-10 → ICD-9 funciona, pero ICD-9 → ICD-10 no):")
        for item in unidirectional[:10]:
            print(f"      {item['icd10']} → {item['icd9']} (one-way)")
    
    # 9. Guardar reporte JSON
    report = {
        'total_icd10_codes': len(icd10_codes),
        'icd10_with_conversion': len(icd10_to_icd9),
        'icd10_without_conversion': len(missing_forward),
        'percentage_missing': round(len(missing_forward) / len(icd10_codes) * 100, 2),
        'families_affected': len(families),
        'top_families': [
            {
                'prefix': prefix,
                'count': len(codes),
                'examples': [c['code'] for c in codes[:5]]
            }
            for prefix, codes in top_families
        ],
        'important_missing': [
            {'code': item['code'], 'description': item['description']}
            for item in important_missing[:50]
        ],
        'unidirectional_count': len(unidirectional)
    }
    
    with open('missing_conversions_report.json', 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    print("\n" + "=" * 80)
    print("✅ Reporte guardado en: missing_conversions_report.json")
    print("=" * 80)
    
    # 10. Resumen ejecutivo
    print("\n" + "=" * 80)
    print("📊 RESUMEN EJECUTIVO")
    print("=" * 80)
    print(f"""
Códigos ICD-10 totales:       {len(icd10_codes):,}
Códigos con conversión:       {len(icd10_to_icd9):,}
Códigos SIN conversión:       {len(missing_forward):,} ({len(missing_forward) / len(icd10_codes) * 100:.1f}%)
Familias afectadas:           {len(families)}

INTERPRETACIÓN:
- La mayoría de códigos ICD-10 ({len(icd10_to_icd9) / len(icd10_codes) * 100:.1f}%) tienen conversión
- Códigos sin conversión son principalmente códigos nuevos en ICD-10
  que no tienen equivalente exacto en ICD-9 (sistema más antiguo)
- Esto es ESPERADO según CMS - no todos los códigos pueden mapearse

ACCIÓN RECOMENDADA:
1. Implementar búsqueda por familia (prefijo) como alternativa
2. Mostrar mensaje informativo cuando no hay conversión exacta
3. Sugerir códigos similares de la misma familia
4. Documentar códigos que requieren conversión manual
    """)

if __name__ == "__main__":
    try:
        analyze_missing_conversions()
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
