import csv

print("Verificando códigos ICD-10 en archivos...")

# Cargar todos los códigos ICD-10 válidos
valid_icd10_codes = set()
with open('icd10cm_codes_2026.txt', 'r', encoding='utf-8') as f:
    for line in f:
        if line.strip():
            parts = line.strip().split(maxsplit=1)
            if parts:
                valid_icd10_codes.add(parts[0])

print(f"Total códigos ICD-10 válidos: {len(valid_icd10_codes)}")

# Verificar códigos en icd9toicd10cmgem.csv
print("\n=== Verificando icd9toicd10cmgem.csv ===")
missing_codes_9to10 = set()
with open('icd9toicd10cmgem.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        icd10_code = row['icd10cm']
        if icd10_code not in valid_icd10_codes:
            missing_codes_9to10.add(icd10_code)

print(f"Códigos ICD-10 en mapeos que NO están en icd10cm_codes_2026.txt: {len(missing_codes_9to10)}")
if missing_codes_9to10:
    print("Primeros 20 códigos faltantes:")
    for code in sorted(list(missing_codes_9to10))[:20]:
        print(f"  - {code}")

# Verificar códigos en icd10cmtoicd9gem.csv
print("\n=== Verificando icd10cmtoicd9gem.csv ===")
missing_codes_10to9 = set()
with open('icd10cmtoicd9gem.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        icd10_code = row['icd10cm']
        if icd10_code not in valid_icd10_codes:
            missing_codes_10to9.add(icd10_code)

print(f"Códigos ICD-10 en mapeos que NO están en icd10cm_codes_2026.txt: {len(missing_codes_10to9)}")
if missing_codes_10to9:
    print("Primeros 20 códigos faltantes:")
    for code in sorted(list(missing_codes_10to9))[:20]:
        print(f"  - {code}")

# Mostrar estadísticas
print("\n=== RESUMEN ===")
print(f"Total códigos ICD-10 válidos: {len(valid_icd10_codes)}")
print(f"Códigos faltantes en mapeos ICD-9 a ICD-10: {len(missing_codes_9to10)}")
print(f"Códigos faltantes en mapeos ICD-10 a ICD-9: {len(missing_codes_10to9)}")

# Unión de todos los códigos faltantes
all_missing = missing_codes_9to10.union(missing_codes_10to9)
print(f"\nTotal códigos únicos que faltan: {len(all_missing)}")
