# 🎨 Frontend Moderno - ICD Codes Converter

## Descripción

Frontend moderno y responsive construido con **Next.js 14**, **React**, **TypeScript** y **Tailwind CSS** para la aplicación de conversión de códigos ICD.

## 🌟 Características

### ✅ Páginas Implementadas

1. **Página Principal (`/`)**
   - Búsqueda de códigos ICD-10 e ICD-9
   - Búsqueda por familia de códigos (prefijos)
   - Resultados organizados en tabs:
     - Información del código
     - Conversión bidireccional
     - Comorbilidades Elixhauser
     - Índice de Charlson
   - Historial de búsquedas (localStorage)
   - Ejemplos de búsqueda rápida

2. **Procesamiento por Lotes (`/batch`)**
   - Conversión de múltiples códigos
   - Entrada por líneas o comas
   - Selección de dirección (ICD-10→ICD-9 o ICD-9→ICD-10)
   - Exportación a CSV
   - Visualización de resultados en tiempo real

3. **Documentación (`/docs`)**
   - Información sobre sistemas ICD
   - Guía de conversión de códigos
   - Explicación de Elixhauser y Charlson
   - Documentación de API
   - Disclaimer importante

### 🎨 Diseño

- **Diseño responsive**: Funciona perfectamente en móviles, tablets y desktop
- **UI moderna**: Tarjetas, tabs, badges, iconos emojis
- **Paleta de colores profesional**: Azul para primario, verde para éxito, amarillo para advertencias
- **Animaciones sutiles**: Transiciones suaves, spinners de carga
- **Accesibilidad**: Estados hover, focus, disabled bien definidos

### 🔧 Arquitectura Técnica

```
backend/app/
├── components/          # Componentes React reutilizables
│   ├── Navbar.tsx      # Navegación principal
│   ├── Footer.tsx      # Pie de página
│   ├── SearchBox.tsx   # Cuadro de búsqueda
│   ├── ResultsTabs.tsx # Tabs de resultados
│   └── SearchHistory.tsx # Historial de búsquedas
│
├── types/              # TypeScript interfaces
│   └── index.ts        # Definiciones de tipos
│
├── utils/              # Utilidades
│   ├── api.ts          # Funciones de llamada a API
│   └── history.ts      # Gestión de historial (localStorage)
│
├── batch/              # Página de procesamiento por lotes
│   └── page.tsx
│
├── docs/               # Página de documentación
│   └── page.tsx
│
├── page.tsx            # Página principal
├── layout.tsx          # Layout global
└── globals.css         # Estilos globales + Tailwind
```

## 🚀 Instalación y Uso

### Prerrequisitos

- Node.js 18+ instalado
- Base de datos Neon PostgreSQL configurada (ver README principal)

### Instalación

```bash
cd backend

# Instalar dependencias (si aún no está hecho)
npm install

# Las dependencias incluyen:
# - next@14.0.0
# - react@^18.2.0
# - react-dom@^18.2.0
# - tailwindcss (dev)
# - @neondatabase/serverless
```

### Configuración

1. Asegúrate de tener el archivo `.env.local` con:
   ```env
   DATABASE_URL=postgresql://user:password@host/database?sslmode=require
   ```

2. Tailwind CSS ya está configurado con:
   - `tailwind.config.js`
   - `postcss.config.js`
   - `app/globals.css`

### Ejecución

```bash
# Modo desarrollo (recomendado)
npm run dev

# Modo producción
npm run build
npm start
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📱 Componentes Principales

### SearchBox
- Búsqueda con validación
- Estado de carga con spinner
- Ejemplos de búsqueda rápida
- Manejo de errores

### ResultsTabs
- Sistema de tabs interactivo
- Badges con contadores
- Visualización de:
  - Código original con descripción
  - Conversiones con indicadores (aproximado, sin mapeo)
  - Categorías Elixhauser con descripciones
  - Score Charlson con interpretación

### SearchHistory
- Últimas 5 búsquedas
- Timestamp formateado
- Click para repetir búsqueda
- Botón para limpiar historial

### Navbar
- Responsive
- Indicador de página activa
- Enlaces a todas las secciones

### Footer
- Información sobre la app
- Fuentes de datos
- Disclaimer visible

## 🎨 Personalización

### Colores

Edita `backend/app/globals.css`:

```css
:root {
  --primary: #2563eb;      /* Azul principal */
  --primary-dark: #1e40af; /* Azul oscuro */
  --secondary: #10b981;    /* Verde secundario */
  --danger: #ef4444;       /* Rojo para errores */
  --warning: #f59e0b;      /* Amarillo para advertencias */
}
```

### Clases Tailwind Personalizadas

```css
.btn-primary      /* Botón principal azul */
.btn-secondary    /* Botón secundario gris */
.card             /* Tarjeta con sombra y borde */
.input            /* Input con estilos */
.badge-primary    /* Badge azul */
.badge-secondary  /* Badge verde */
.badge-warning    /* Badge amarillo */
```

## 🔌 Integración con API

El frontend se comunica con la API REST mediante funciones en `utils/api.ts`:

```typescript
// Buscar código
const result = await searchCode('E10.10')

// Buscar familia
const family = await searchFamily('E10')

// Convertir código
const conversion = await convertCode('E1010', 'icd10', 'icd9')

// Obtener Elixhauser
const elixhauser = await getElixhauser('E1010')

// Obtener Charlson
const charlson = await getCharlson('E10', 'icd10')
```

## 📊 Estado de la Aplicación

### Gestión de Estado

- **React Hooks**: `useState`, `useEffect`
- **LocalStorage**: Para historial de búsquedas
- **Async/Await**: Para llamadas a API
- **Error Handling**: Manejo robusto de errores

### Flujo de Datos

```
Usuario → SearchBox → handleSearch() 
       ↓
   Llamadas API paralelas:
   - searchCode/searchFamily
   - convertCode
   - getElixhauser
   - getCharlson
       ↓
   Actualización de estado
       ↓
   ResultsTabs muestra resultados
```

## 🐛 Solución de Problemas

### Error: Cannot find module 'tailwindcss'
```bash
npm install -D tailwindcss postcss autoprefixer
```

### Error: API calls failing
- Verifica que el backend esté corriendo en puerto 3000
- Revisa la configuración de DATABASE_URL en .env.local
- Comprueba los logs del servidor Next.js

### Estilos no se aplican
- Reinicia el servidor de desarrollo
- Verifica que `globals.css` esté importado en `layout.tsx`
- Limpia caché: `rm -rf .next && npm run dev`

## 📈 Próximas Mejoras

- [ ] Autocompletado en tiempo real
- [ ] Búsqueda fuzzy en el frontend
- [ ] Modo oscuro
- [ ] Exportar resultados a PDF
- [ ] Gráficos de comorbilidades
- [ ] PWA (Progressive Web App)
- [ ] Tests con Jest y React Testing Library

## 📝 Notas Técnicas

### TypeScript

Todos los componentes usan TypeScript estricto con interfaces bien definidas:
- `ICDCode`: Código ICD con descripción
- `ConversionResult`: Resultado de conversión
- `ElixhauserCategory`: Categoría Elixhauser
- `CharlsonResult`: Resultado Charlson
- `SearchHistory`: Entrada de historial

### Performance

- **Client Components**: Uso de `'use client'` donde es necesario
- **Lazy Loading**: Next.js carga páginas bajo demanda
- **Optimized Images**: Uso de emojis en lugar de imágenes
- **Minimal Bundle**: Solo dependencias necesarias

### SEO y Meta Tags

```typescript
export const metadata = {
  title: 'ICD Codes Converter - ICD-10 ↔ ICD-9',
  description: 'Conversión bidireccional de códigos...'
}
```

## 🤝 Contribuciones

Para contribuir al frontend:

1. Sigue la estructura de componentes existente
2. Usa TypeScript con tipos explícitos
3. Aplica las clases de Tailwind consistentemente
4. Documenta componentes complejos
5. Mantén la accesibilidad (aria-labels, semántica HTML)

## 📄 Licencia

MIT License - Ver LICENSE en el directorio raíz

---

**Desarrollado con ❤️ usando Next.js 14, React, TypeScript y Tailwind CSS**

*Última actualización: Noviembre 8, 2025*
