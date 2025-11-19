import csv

print("Buscando código problemático A0#7 o similar...")

with open('icd9toicd10cmgem.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        code = row['icd10cm']
        # Buscar códigos que contengan caracteres especiales no válidos
        if any(c in code for c in ['#', '@', '&', '*', '<', '>']):
            print(f"ICD9: {row['icd9cm']} -> ICD10: '{code}'")
        # Buscar específicamente A0 con algún problema
        if code.startswith('A0') and ('7' in code):
            if '.' not in code or len(code) < 4:
                print(f"Posible problema: ICD9: {row['icd9cm']} -> ICD10: '{code}' (formato)")

print("\nBuscando en icd10_codes_2026.txt...")
with open('icd10cm_codes_2026.txt', 'r', encoding='utf-8') as f:
    for line in f:
        if line.strip() and 'A0' in line and '7' in line:
            parts = line.strip().split(maxsplit=1)
            if len(parts) >= 1:
                code = parts[0]
                if any(c in code for c in ['#', '@', '&', '*', '<', '>']):
                    print(f"Código con caracter especial: '{code}'")
