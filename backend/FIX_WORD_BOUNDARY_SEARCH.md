# Fix: Búsqueda por Palabras Completas (Word Boundary)

## Problema Identificado

La búsqueda por descripción aceptaba abreviaturas médicas y las expandía correctamente usando sinónimos. Sin embargo, al introducir la abreviatura **"MI"** (que se expande a "myocardial infarction" y "heart attack"), la lista de códigos devueltos incluía patologías sin relación:

- ❌ H5703 - **mi**osis
- ❌ R430 - anos**mi**a  
- ❌ D72825 - bande**mi**a
- ❌ R431 - paros**mi**a
- ❌ Q172 - **mi**crotia

**Causa raíz**: La consulta SQL usaba `ILIKE '%MI%'` que hace matching de substring, encontrando "MI" dentro de cualquier palabra.

## Solución Implementada

Se cambió la búsqueda de **substring matching** a **word boundary matching** usando expresiones regulares de PostgreSQL:

### Antes
```typescript
const icd10Results = await sql`
  SELECT code, description
  FROM icd10_codes
  WHERE description ILIKE ${'%' + expandedQuery + '%'}
  ORDER BY LENGTH(description)
  LIMIT 20
`
```

### Después
```typescript
const searchPattern = expandedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const icd10Results = await sql`
  SELECT code, description
  FROM icd10_codes
  WHERE description ~* ${`(^|[^a-z])${searchPattern}([^a-z]|$)`}
  ORDER BY LENGTH(description)
  LIMIT 20
`
```

### Explicación del Regex

- `~*` - Operador regex case-insensitive de PostgreSQL
- `(^|[^a-z])` - Inicio de string o carácter no-letra (word boundary izquierdo)
- `${searchPattern}` - El término de búsqueda escapado
- `([^a-z]|$)` - Carácter no-letra o fin de string (word boundary derecho)

Esto asegura que "MI" solo coincida cuando:
- ✅ Está al inicio de una palabra: "MI" en "**MI** classification"
- ✅ Está como palabra completa: "myocardial" en "acute **myocardial** infarction"
- ❌ NO coincide dentro de palabras: "mi" en "anos**mi**a"

## Archivos Modificados

1. **`backend/app/api/search-description/route.ts`**
   - Actualizado para usar word boundary regex

2. **`backend/app/api/search-description-enhanced/route.ts`**
   - Actualizado para usar word boundary regex
   - Mantiene la funcionalidad de expansión de sinónimos

## Resultados

### Búsqueda: "MI"

#### Antes del fix
- H5703 - miosis ❌
- R430 - anosmia ❌
- D72825 - bandemia ❌
- R431 - parosmia ❌
- Q172 - microtia ❌

#### Después del fix
- I214 - Non-ST elevation (NSTEMI) myocardial infarction ✅
- I222 - Subsequent non-ST elevation (NSTEMI) myocardial infarction ✅
- I21B - Myocardial infarction with coronary microvascular dysfunction ✅
- I213 - ST elevation (STEMI) myocardial infarction ✅
- I252 - Old myocardial infarction ✅

### Búsqueda: "miosis"
- H5703 - Miosis ✅ (coincidencia exacta, funciona correctamente)

## Testing

```bash
# Test MI (infarto de miocardio)
curl "http://localhost:3002/api/search-description-enhanced?query=MI"

# Test miosis (debe devolver solo H5703)
curl "http://localhost:3002/api/search-description-enhanced?query=miosis"
```

## Fecha
11 de noviembre de 2025

## Estado
✅ **RESUELTO** - La búsqueda ahora filtra correctamente por contexto y solo asocia términos completos.
