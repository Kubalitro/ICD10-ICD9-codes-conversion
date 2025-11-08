# ICD-10 ↔ ICD-9 Code Conversion & Classification Tool

Web application for converting diagnostic codes between ICD-10-CM and ICD-9-CM, with Elixhauser comorbidity classification and Charlson Comorbidity Index calculation.

## 🌟 Features

- ✅ Bidirectional conversion between ICD-10-CM and ICD-9-CM
- ✅ Search by specific code or entire code family (e.g., E10 = all Type 1 Diabetes)
- ✅ Elixhauser comorbidity classification (39 conditions)
- ✅ Charlson Comorbidity Index calculation with scores
- ✅ Complete ICD-10 code descriptions
- ✅ Search history (last 5 searches)
- ✅ **NEW**: Cloud database option (Neon PostgreSQL) - no large files to download
- ✅ Data from official sources (CMS, NBER, AHRQ, PMC-NCBI)

## 🎯 Two Deployment Options

### Option A: Static Web App (Existing)
- Works entirely in browser
- Loads JSON files (~50 MB)
- No backend required
- Quick to deploy

### Option B: **Database-Backed App (NEW - Recommended)** 🚀
- Powered by Neon PostgreSQL
- No large file downloads
- Better performance
- Scalable for production
- API-based architecture
- **Start here**: [QUICK_START.md](./QUICK_START.md)

## ⚠️ Disclaimer

**Esta aplicación es solo para fines educativos y de referencia.**

El creador no es un profesional de la salud y no se responsabiliza del uso que se le dé a esta aplicación. Todos los códigos deben ser revisados y validados por profesionales médicos cualificados. No utilice esta información para diagnósticos o tratamientos sin supervisión apropiada.

## 📊 Fuentes de Datos

- **ICD-10 ↔ ICD-9 Mappings:** CMS.gov, NBER.org
- **Comorbilidades Elixhauser:** HCUP-US-AHRQ.gov
- **Índice de Charlson:** PMC-NCBI.NLM.NIH.gov (CDMF CCI)

## 🚀 Quick Start

### Option A: Static Web App (Simple Setup)

**Prerequisites:**
- Python 3.7+
- Pandas and openpyxl

**Steps:**

1. Install Python dependencies:
```bash
pip install pandas openpyxl
```

2. Process data files:
```bash
python process_data.py
```

This generates JSON files in `web/data/`:
- `icd10_to_icd9.json` (~70k códigos)
- `icd9_to_icd10.json` (~15k códigos)
- `icd10_descriptions.json` (~75k descripciones)
- `elixhauser.json` (~4.5k códigos)
- `charlson_icd10.json` (278 códigos)
- `charlson_icd9.json` (188 códigos)

### Paso 3: Abrir la aplicación

Simplemente abre `web/index.html` en tu navegador web. No se requiere servidor web.

## 📁 Estructura del Proyecto

```
ICD10-ICD9-codes-conversion/
├── web/
│   ├── index.html              # Página principal
│   ├── docs.html               # Documentación
│   ├── styles.css              # Estilos
│   ├── app.js                  # Lógica de la aplicación
│   └── data/                   # Archivos JSON generados
│       ├── icd10_to_icd9.json
│       ├── icd9_to_icd10.json
│       ├── icd10_descriptions.json
│       ├── elixhauser.json
│       ├── charlson_icd10.json
│       └── charlson_icd9.json
├── process_data.py             # Script para procesar datos
├── icd10cmtoicd9gem.csv        # Mapeo oficial CMS
├── icd9toicd10cmgem.csv        # Mapeo oficial CMS
├── icd10cm_codes_2026.txt      # Descripciones ICD-10
├── CMR-Reference-File-v2025-1.xlsx  # Elixhauser de AHRQ
└── README.md
```

## 🎯 Cómo Usar

### Búsqueda de Códigos

1. **Código específico:** Introduce un código completo como `E10.10` o `25000`
2. **Familia de códigos:** Introduce un código parcial como `E10` para obtener todos los códigos relacionados

### Interpretación de Resultados

La aplicación muestra cuatro secciones:

1. **Código Original:** El código buscado con su descripción
2. **Conversión ICD:** Códigos equivalentes en la otra clasificación
3. **Comorbilidades Elixhauser:** Comorbilidades asociadas al código
4. **Índice Charlson:** Score de comorbilidad con las condiciones encontradas

### Ejemplos de Búsqueda

- `E10` → Muestra todos los códigos de Diabetes tipo 1
- `E10.10` → Código específico de Diabetes tipo 1 con cetoacidosis
- `250` → Familia ICD-9 de Diabetes mellitus
- `25000` → Código ICD-9 específico

## 📖 Documentación

Para más información sobre:
- Sistemas de clasificación ICD-10 e ICD-9
- Comorbilidades Elixhauser
- Índice de Charlson
- Metodología técnica
- Limitaciones y advertencias

Consulta la **[Página de Documentación](web/docs.html)** incluida en la aplicación.

## 🔧 Desarrollo

### Actualizar Datos

Si necesitas actualizar los mapeos:

1. Descarga los archivos más recientes de:
   - [CMS ICD-10](https://www.cms.gov/medicare/coding-billing/icd-10-codes)
   - [AHRQ Elixhauser](https://hcup-us.ahrq.gov/toolssoftware/comorbidityicd10/comorbidity_icd10.jsp)

2. Reemplaza los archivos en el directorio raíz

3. Ejecuta nuevamente `python process_data.py`

### Personalizar la Aplicación

Los archivos web son estáticos y pueden ser personalizados:
- **HTML:** Modifica `index.html` o `docs.html`
- **CSS:** Edita `styles.css` para cambiar colores y estilos
- **JavaScript:** Modifica `app.js` para cambiar la lógica

## 📝 Notas Técnicas

### Conversión de Códigos

- Utiliza los General Equivalence Mappings (GEMs) oficiales de CMS
- Soporta mapeos 1:1, 1:N, N:1
- Indica conversiones aproximadas cuando la equivalencia no es exacta

### Búsqueda por Familia

- La notación `E10.x` o `E10` busca todos los códigos que comienzan con ese prefijo
- Útil para ver todas las variantes de un diagnóstico

### Índice Charlson

- Busca primero en códigos ICD-10 (preferencia)
- Si no encuentra, busca en códigos ICD-9
- Aplica jerarquía automáticamente (condiciones graves sobrescriben leves del mismo tipo)

## 🔒 Privacidad

- La aplicación funciona completamente en el navegador
- No se envían datos a ningún servidor externo
- El historial se guarda solo en localStorage del navegador
- Puede usarse sin conexión a internet después de la carga inicial

## 📜 Licencia

Datos de dominio público de fuentes gubernamentales y académicas.

Código de la aplicación: MIT License

## 🙏 Créditos

- **CMS.gov** - General Equivalence Mappings
- **NBER.org** - ICD Crosswalks
- **HCUP-US-AHRQ.gov** - Elixhauser Comorbidity Software
- **PMC-NCBI.NLM.NIH.gov** - Charlson Comorbidity Index Research

## 📧 Contacto

Esta es una herramienta educativa desarrollada de forma independiente.

Para preguntas sobre codificación médica oficial, consulte con profesionales certificados o las guías oficiales de CMS y WHO.

---

**Última actualización:** 2025  
**Versión ICD-10-CM:** 2026  
**Elixhauser:** Versión Refinada 2025.1
no es exacta

### Búsqueda por Familia

- La notación `E10.x` o `E10` busca todos los códigos que comienzan con ese prefijo
- Útil para ver todas las variantes de un diagnóstico

### Índice Charlson

- Busca primero en códigos ICD-10 (preferencia)
- Si no encuentra, busca en códigos ICD-9
- Aplica jerarquía automáticamente (condiciones graves sobrescriben leves del mismo tipo)

## 🔒 Privacidad

- La aplicación funciona completamente en el navegador
- No se envían datos a ningún servidor externo
- El historial se guarda solo en localStorage del navegador
- Puede usarse sin conexión a internet después de la carga inicial

## 📜 Licencia

Datos de dominio público de fuentes gubernamentales y académicas.

Código de la aplicación: MIT License

## 🙏 Créditos

- **CMS.gov** - General Equivalence Mappings
- **NBER.org** - ICD Crosswalks
- **HCUP-US-AHRQ.gov** - Elixhauser Comorbidity Software
- **PMC-NCBI.NLM.NIH.gov** - Charlson Comorbidity Index Research

## 📧 Contacto

Esta es una herramienta educativa desarrollada de forma independiente.

Para preguntas sobre codificación médica oficial, consulte con profesionales certificados o las guías oficiales de CMS y WHO.

---

**Última actualización:** 2025  
**Versión ICD-10-CM:** 2026  
**Elixhauser:** Versión Refinada 2025.1
