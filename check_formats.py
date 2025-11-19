import csv

# Verificar formato en icd10cm_codes_2026.txt
print("=== Formato en icd10cm_codes_2026.txt ===")
with open('icd10cm_codes_2026.txt', 'r', encoding='utf-8') as f:
    lines = [l.strip() for l in f if l.strip()][:20]
    for line in lines:
        parts = line.split(maxsplit=1)
        if parts:
            print(f"Código: '{parts[0]}'")
    print(f"\nTotal códigos: {len([l for l in open('icd10cm_codes_2026.txt') if l.strip()])}")

# Verificar formato en icd9toicd10cmgem.csv
print("\n=== Formato en icd9toicd10cmgem.csv ===")
with open('icd9toicd10cmgem.csv', 'r', encoding='utf-8') as f:
    reader = list(csv.DictReader(f))
    for row in reader[:20]:
        print(f"ICD9: '{row['icd9cm']}' -> ICD10: '{row['icd10cm']}'")
    print(f"\nTotal mapeos: {len(reader)}")

# Buscar códigos A07 específicamente
print("\n=== Códigos A07 en archivos ===")
print("\nEn icd10cm_codes_2026.txt:")
with open('icd10cm_codes_2026.txt', 'r', encoding='utf-8') as f:
    a07_codes = [l.split()[0] for l in f if l.strip() and l.split()[0].startswith('A07')]
    print(f"Códigos A07*: {a07_codes}")

print("\nEn icd9toicd10cmgem.csv:")
with open('icd9toicd10cmgem.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    a07_in_csv = [row['icd10cm'] for row in reader if row['icd10cm'].startswith('A07')]
    print(f"Códigos A07* en mapeos: {a07_in_csv}")
