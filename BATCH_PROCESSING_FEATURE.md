# 📋 Funcionalidad de Procesamiento por Lotes (Batch Processing)

## ✅ Implementación Completada

Se ha implementado exitosamente la funcionalidad para procesar **múltiples códigos ICD** simultáneamente, con cálculo agregado de puntuaciones de comorbilidad.

---

## 🎯 Características Implementadas

### 1. **Endpoint Backend** (`/api/batch`)

**Ubicación**: `backend/app/api/batch/route.ts`

**Métodos**:
- **GET**: Devuelve información sobre el uso del endpoint
- **POST**: Procesa múltiples códigos ICD

**Parámetros POST**:
```json
{
  "codes": ["E1010", "E1165", "I10"],
  "system": "icd10"  // o "icd9"
}
```

**Respuesta**:
```json
{
  "inputCodes": ["E1010", "E1165", "I10"],
  "conversions": [...],  // Conversiones de cada código
  "aggregatedCharlson": {
    "totalScore": 0,
    "conditions": []
  },
  "aggregatedElixhauser": {
    "categories": [...],
    "totalCategories": 3
  },
  "summary": {
    "totalInputCodes": 3,
    "successfulConversions": 3,
    "failedConversions": 0
  }
}
```

### 2. **Interfaz Web Actualizada**

**Archivos modificados**:
- `web/index.html` - Nuevo modo "Múltiples Códigos"
- `web/styles.css` - Estilos para el modo batch
- `web/app.js` - Lógica de procesamiento y visualización

**Características de la interfaz**:
- ✅ **Toggle de modos**: Cambiar entre "Código Individual" y "Múltiples Códigos"
- ✅ **Entrada flexible**: Los códigos se pueden separar por:
  - Comas: `E10.10, E11.65, I10`
  - Espacios: `E10.10 E11.65 I10`
  - Líneas nuevas (uno por línea)
  - Cualquier combinación
- ✅ **Selector de sistema**: ICD-10 o ICD-9
- ✅ **Visualización de resumen**: Estadísticas agregadas
- ✅ **Resultados detallados**: Conversiones, Charlson y Elixhauser

---

## 📊 Lógica de Agregación

### **Charlson Comorbidity Index**
- ✅ **Sin duplicados**: Las condiciones se cuentan solo una vez
- ✅ **Jerarquía**: Se aplica la puntuación más alta cuando hay diferencias de severidad
  - Ejemplo: "Diabetes with complications" (score: 2) sobrescribe "Diabetes without complications" (score: 1)
- ✅ **Fuentes múltiples**: Se busca en ICD-10 primero, luego en ICD-9
- ✅ **Matching por familia**: Si no hay coincidencia exacta, busca por prefijo

### **Elixhauser Comorbidities**
- ✅ **Categorías únicas**: Se eliminan duplicados
- ✅ **Solo ICD-10**: Elixhauser solo está disponible para códigos ICD-10
- ✅ **Códigos agrupados**: Muestra qué códigos ICD activaron cada categoría

---

## 🧪 Pruebas Realizadas

### **Test 1: Códigos ICD-10 básicos**
```
Entrada: E1010, E1165, I10
Resultado:
  ✅ 3 códigos procesados
  ✅ 3 conversiones exitosas
  ✅ 3 categorías Elixhauser
  ✅ 0 condiciones Charlson (estos códigos no tienen puntuación Charlson)
```

### **Test 2: Códigos ICD-10 con Charlson**
```
Entrada: C509, I509, J449, N185, B20
Resultado:
  ✅ 5 códigos procesados
  ✅ 4 conversiones exitosas
  ✅ Score Charlson: 12 puntos
  ✅ Condiciones:
     - AIDS/HIV: +6
     - Any Malignancy: +2
     - Renal Disease: +2
     - Congestive Heart Failure: +1
     - Chronic Pulmonary Disease: +1
  ✅ 4 categorías Elixhauser
```

### **Test 3: Códigos ICD-9**
```
Entrada: 25000, 4019, 5849
Resultado:
  ✅ 3 códigos procesados
  ✅ 3 conversiones exitosas
  ✅ Conversión correcta a ICD-10
  ✅ 2 categorías Elixhauser
```

---

## 🚀 Cómo Usar

### **Desde la Interfaz Web**:
1. Navegar a `http://localhost:3001` (o el puerto correspondiente)
2. Hacer clic en el botón "📋 Múltiples Códigos"
3. Introducir códigos en el textarea (separados por comas, espacios o líneas)
4. Seleccionar el sistema (ICD-10 o ICD-9)
5. Hacer clic en "🔄 Convertir Todos"
6. Ver los resultados agregados

### **Desde la API**:
```bash
curl -X POST http://localhost:3001/api/batch \
  -H "Content-Type: application/json" \
  -d '{
    "codes": ["E1010", "E1165", "I10"],
    "system": "icd10"
  }'
```

---

## 📈 Visualización de Resultados

### **1. Resumen Estadístico**
- Cuadros con métricas:
  - Códigos totales
  - Conversiones exitosas
  - Conversiones fallidas
  - Tasa de éxito (%)

### **2. Conversiones Detalladas**
- Lista de cada código con:
  - Código original + descripción
  - Códigos destino
  - Flags (aproximado, combinación, etc.)
- Scroll automático si hay muchos resultados

### **3. Charlson Agregado**
- Score total destacado
- Lista de condiciones con puntuación
- Códigos que activaron cada condición

### **4. Elixhauser Agregado**
- Número de categorías únicas
- Detalle de cada categoría:
  - Código
  - Nombre
  - Descripción
  - Códigos ICD-10 que la activan

---

## 🔧 Detalles Técnicos

### **Performance**:
- Las consultas se ejecutan en paralelo cuando es posible
- Se utilizan Sets para evitar duplicados
- Límite de 5 códigos destino mostrados por defecto (con indicador de "... y X más")

### **Manejo de Errores**:
- Validación de entrada (array no vacío, sistema válido)
- Códigos sin conversión se marcan claramente
- Mensajes de error descriptivos

### **Base de Datos**:
- Usa Neon PostgreSQL serverless
- Consultas optimizadas con JOINs
- Matching por prefijo para familias de códigos

---

## 📝 Notas Importantes

⚠️ **Disclaimers**:
- Esta es una herramienta educativa y de referencia
- Las conversiones y puntuaciones deben ser validadas por profesionales médicos
- No usar para decisiones clínicas sin supervisión apropiada

📊 **Limitaciones**:
- Elixhauser solo disponible para códigos ICD-10
- Charlson puede no cubrir todos los códigos (algunos retornan score 0)
- Las conversiones ICD-10↔ICD-9 pueden ser aproximadas

---

## ✨ Estado Final

✅ **Backend completo**: Endpoint `/api/batch` funcional
✅ **Frontend completo**: Interfaz con toggle de modos
✅ **Lógica de agregación**: Charlson y Elixhauser sin duplicados
✅ **Visualización**: Resultados claros y detallados
✅ **Probado**: Múltiples escenarios de uso exitosos

**Fecha de implementación**: 8 de noviembre, 2025
