# ICD Codes API Backend

API REST para conversión de códigos ICD-10 ↔ ICD-9, clasificación Elixhauser y cálculo de Charlson Comorbidity Index.

## 🚀 Configuración Rápida

### 1. Instalar Dependencias

```bash
cd backend
npm install
```

### 2. Configurar Variables de Entorno

Copia el archivo de ejemplo y actualiza con tu DATABASE_URL de Neon:

```bash
cp .env.local.example .env.local
```

Edita `.env.local`:
```
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```

### 3. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

El servidor estará disponible en: `http://localhost:3000`

## 📚 Endpoints de la API

### 1. **Search - Buscar Códigos**

```
GET /api/search?code=E10.10&type=auto
```

**Parámetros:**
- `code` (required): Código ICD a buscar
- `type` (optional): `auto` (default), `icd10`, o `icd9`
- `fuzzy` (optional): `true` para búsqueda por descripción

**Ejemplo:**
```bash
curl "http://localhost:3000/api/search?code=E10.10"
```

**Respuesta:**
```json
{
  "code": "E10.10",
  "system": "ICD-10-CM",
  "description": "Type 1 diabetes mellitus with ketoacidosis without coma",
  "isFamily": false
}
```

---

### 2. **Convert - Convertir Códigos**

```
GET /api/convert?code=E10.10&from=icd10&to=icd9
```

**Parámetros:**
- `code` (required): Código a convertir
- `from` (required): `icd10` o `icd9`
- `to` (required): `icd9` o `icd10`

**Ejemplo:**
```bash
curl "http://localhost:3000/api/convert?code=E10.10&from=icd10&to=icd9"
```

**Respuesta:**
```json
{
  "sourceCode": "E10.10",
  "sourceSystem": "ICD-10-CM",
  "sourceDescription": "Type 1 diabetes mellitus with ketoacidosis without coma",
  "targetSystem": "ICD-9-CM",
  "conversions": [
    {
      "targetCode": "25011",
      "approximate": false,
      "noMap": false,
      "combination": false,
      "scenario": 1,
      "choiceList": 1
    }
  ],
  "totalCount": 1
}
```

---

### 3. **Elixhauser - Clasificación de Comorbilidades**

```
GET /api/elixhauser?code=A1801
```

**Parámetros:**
- `code` (required): Código ICD-10

**39 categorías disponibles:** AIDS, ALCOHOL, ANEMDEF, AUTOIMMUNE, CANCER_SOLID, DIAB_CX, HTN_CX, LIVER_MLD, etc.

**Ejemplo:**
```bash
curl "http://localhost:3000/api/elixhauser?code=A1801"
```

**Respuesta:**
```json
{
  "code": "A1801",
  "system": "ICD-10-CM",
  "codeDescription": "Tuberculosis of spine",
  "categories": [
    {
      "code": "AUTOIMMUNE",
      "name": "AUTOIMMUNE",
      "description": "Autoimmune conditions"
    }
  ],
  "totalCategories": 1
}
```

---

### 4. **Charlson - Score de Comorbilidad**

```
GET /api/charlson?code=E10.10&system=icd10
```

**Parámetros:**
- `code` (required): Código ICD
- `system` (optional): `icd10` (default) o `icd9`

**Ejemplo:**
```bash
curl "http://localhost:3000/api/charlson?code=E10.10&system=icd10"
```

**Respuesta:**
```json
{
  "code": "E10.10",
  "system": "ICD-10-CM",
  "codeDescription": "Type 1 diabetes mellitus with ketoacidosis without coma",
  "condition": "Diabetes with Complications",
  "score": 2,
  "matchType": "prefix"
}
```

---

### 5. **Family - Códigos de Familia**

```
GET /api/family?prefix=E10&system=icd10&limit=10
```

**Parámetros:**
- `prefix` (required): Prefijo del código
- `system` (optional): `icd10` (default) o `icd9`
- `limit` (optional): Número máximo de resultados (default: 100)

**Ejemplo:**
```bash
curl "http://localhost:3000/api/family?prefix=E10&limit=5"
```

**Respuesta:**
```json
{
  "prefix": "E10",
  "system": "ICD-10-CM",
  "codes": [
    {
      "code": "E1010",
      "description": "Type 1 diabetes mellitus with ketoacidosis without coma"
    },
    {
      "code": "E1011",
      "description": "Type 1 diabetes mellitus with ketoacidosis with coma"
    }
  ],
  "count": 5,
  "totalCount": 125
}
```

## 🔧 Estructura del Proyecto

```
backend/
├── app/
│   └── api/
│       ├── search/
│       │   └── route.ts       # Endpoint de búsqueda
│       ├── convert/
│       │   └── route.ts       # Endpoint de conversión
│       ├── elixhauser/
│       │   └── route.ts       # Clasificación Elixhauser
│       ├── charlson/
│       │   └── route.ts       # Score Charlson
│       └── family/
│           └── route.ts       # Búsqueda de familia
├── lib/
│   └── db.ts                  # Utilidad de conexión a BD
├── .env.local                 # Variables de entorno (no incluir en git)
├── .env.local.example         # Ejemplo de configuración
├── next.config.js             # Configuración de Next.js
├── package.json               # Dependencias
├── tsconfig.json              # Configuración TypeScript
└── README.md                  # Esta documentación
```

## 🧪 Pruebas Rápidas

### Usando curl:

```bash
# Buscar código
curl "http://localhost:3000/api/search?code=E10.10"

# Convertir ICD-10 a ICD-9
curl "http://localhost:3000/api/convert?code=E10.10&from=icd10&to=icd9"

# Obtener Elixhauser
curl "http://localhost:3000/api/elixhauser?code=A1801"

# Obtener Charlson
curl "http://localhost:3000/api/charlson?code=I21&system=icd10"

# Buscar familia E10
curl "http://localhost:3000/api/family?prefix=E10&limit=5"
```

### Usando JavaScript/Fetch:

```javascript
// Buscar código
fetch('http://localhost:3000/api/search?code=E10.10')
  .then(res => res.json())
  .then(data => console.log(data));

// Convertir código
fetch('http://localhost:3000/api/convert?code=E10.10&from=icd10&to=icd9')
  .then(res => res.json())
  .then(data => console.log(data));
```

## 📦 Build para Producción

```bash
npm run build
npm start
```

## 🚢 Deploy a Vercel

1. Instala Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Configura las variables de entorno en Vercel Dashboard:
   - `DATABASE_URL`: Tu connection string de Neon

## 🔒 Seguridad

- Todas las consultas usan prepared statements (protección SQL injection)
- Variables de entorno para credenciales sensibles
- Rate limiting recomendado para producción

## 📝 Notas

- La base de datos debe estar previamente poblada (ver `/database/load_data.py`)
- Todos los endpoints retornan JSON
- Códigos HTTP estándar (200, 400, 404, 500)
- CORS habilitado por defecto en Next.js

## 🐛 Troubleshooting

### Error: "DATABASE_URL not found"
- Verifica que `.env.local` existe y contiene `DATABASE_URL`
- Reinicia el servidor después de cambiar variables de entorno

### Error: "Connection refused"
- Verifica que la URL de Neon es correcta
- Asegúrate de incluir `?sslmode=require` en la URL
- Verifica que tu IP está permitida en Neon

### Error: "Function does not exist"
- Ejecuta el schema completo: `psql <url> < ../database/schema.sql`

## 📚 Recursos

- [Next.js Docs](https://nextjs.org/docs)
- [Neon Serverless Driver](https://neon.tech/docs/serverless/serverless-driver)
- [ICD-10-CM Codes](https://www.cms.gov/medicare/coding-billing/icd-10-codes)
