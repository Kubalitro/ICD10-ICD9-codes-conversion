# 🚀 Guía de Deployment a Vercel

Esta guía te llevará paso a paso para hacer el deploy de tu API ICD Codes a producción en Vercel.

---

## 📋 Requisitos Previos

- ✅ Node.js instalado
- ✅ Git instalado
- ✅ Cuenta de GitHub (para repositorio)
- ✅ Cuenta de Vercel (gratis en https://vercel.com)
- ✅ Base de datos Neon PostgreSQL configurada

---

## 🎯 MÉTODO 1: Deploy desde GitHub (RECOMENDADO)

### **Paso 1: Preparar Repositorio GitHub**

1. **Asegúrate de que tu proyecto esté en GitHub:**
   ```bash
   # Si aún no está en GitHub:
   cd C:\Users\marct\ICD10-ICD9-codes-conversion
   git init
   git add .
   git commit -m "Initial commit - ICD Codes API"
   git branch -M main
   git remote add origin https://github.com/Atlas9266/ICD10-ICD9-codes-conversion.git
   git push -u origin main
   ```

2. **Verifica que `.env.local` NO esté en el repositorio:**
   ```bash
   git status
   # .env.local NO debe aparecer (está en .gitignore)
   ```

### **Paso 2: Conectar con Vercel**

1. **Ve a https://vercel.com**
2. **Click en "Sign Up" o "Log In"**
3. **Autoriza con GitHub**
4. **Click en "Add New Project"**
5. **Importa tu repositorio:**
   - Busca: `ICD10-ICD9-codes-conversion`
   - Click en "Import"

### **Paso 3: Configurar el Proyecto**

1. **Framework Preset:** Next.js (detectado automáticamente)
2. **Root Directory:** Cambia a `backend`
   - Click en "Edit" al lado de Root Directory
   - Escribe: `backend`
   - Click "Continue"

3. **Build Settings:**
   - Build Command: `npm run build` (automático)
   - Output Directory: `.next` (automático)
   - Install Command: `npm install` (automático)

### **Paso 4: Configurar Variables de Entorno**

⚠️ **MUY IMPORTANTE** - Sin esto la API no funcionará:

1. **En la sección "Environment Variables":**
   
   **Variable 1:**
   - Name: `DATABASE_URL`
   - Value: `postgresql://neondb_owner:npg_2juX6QvRKyYI@ep-muddy-night-aggdzucy.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require`
   - Environment: Production, Preview, Development (todos)
   - Click "Add"

2. **Click en "Deploy"**

### **Paso 5: Esperar el Deployment**

- El proceso toma 1-3 minutos
- Verás los logs en tiempo real
- Cuando termine, verás: ✅ "Deployment Ready"

### **Paso 6: Probar la API**

1. **Click en "Visit" o copia la URL:**
   - Ejemplo: `https://icd10-icd9-codes-conversion.vercel.app`

2. **Prueba los endpoints:**
   ```bash
   # Página principal
   https://tu-proyecto.vercel.app

   # Test endpoint
   https://tu-proyecto.vercel.app/api/test

   # Search endpoint
   https://tu-proyecto.vercel.app/api/search?code=E10.10

   # Convert endpoint
   https://tu-proyecto.vercel.app/api/convert?code=E10.10&from=icd10&to=icd9
   ```

---

## 🎯 MÉTODO 2: Deploy con Vercel CLI

### **Paso 1: Instalar Vercel CLI**

```bash
npm install -g vercel
```

### **Paso 2: Login en Vercel**

```bash
vercel login
```
- Te pedirá que confirmes tu email

### **Paso 3: Deploy desde la Línea de Comandos**

```bash
cd C:\Users\marct\ICD10-ICD9-codes-conversion\backend
vercel
```

**Responde las preguntas:**
```
? Set up and deploy "backend"? [Y/n] Y
? Which scope do you want to deploy to? (tu usuario)
? Link to existing project? [y/N] N
? What's your project's name? icd-codes-api
? In which directory is your code located? ./
? Want to override the settings? [y/N] N
```

### **Paso 4: Configurar Variables de Entorno**

```bash
vercel env add DATABASE_URL production
```
- Pega tu DATABASE_URL cuando te lo pida
- Repite para preview y development si quieres

### **Paso 5: Deploy a Producción**

```bash
vercel --prod
```

---

## 🎯 MÉTODO 3: Deploy Manual (Drag & Drop)

### **Paso 1: Build Local**

```bash
cd C:\Users\marct\ICD10-ICD9-codes-conversion\backend
npm run build
```

### **Paso 2: Upload a Vercel**

1. Ve a https://vercel.com/new
2. Arrastra la carpeta `backend` al navegador
3. Configura las variables de entorno
4. Click "Deploy"

---

## ✅ VERIFICACIÓN POST-DEPLOYMENT

### **1. Prueba todos los endpoints:**

```bash
# Reemplaza YOUR_URL con tu URL de Vercel

# Test
curl "https://YOUR_URL.vercel.app/api/test"

# Search
curl "https://YOUR_URL.vercel.app/api/search?code=E10.10"

# Convert
curl "https://YOUR_URL.vercel.app/api/convert?code=E10.10&from=icd10&to=icd9"

# Elixhauser
curl "https://YOUR_URL.vercel.app/api/elixhauser?code=A1801"

# Charlson
curl "https://YOUR_URL.vercel.app/api/charlson?code=I21&system=icd10"

# Family
curl "https://YOUR_URL.vercel.app/api/family?prefix=E10&limit=5"
```

### **2. Revisa los Logs:**

- En Vercel Dashboard → Tu proyecto → "Logs"
- Busca errores o warnings

### **3. Verifica Performance:**

- En Vercel Dashboard → Tu proyecto → "Analytics"
- Revisa tiempos de respuesta

---

## 🔧 CONFIGURACIÓN ADICIONAL

### **Dominio Personalizado**

1. En Vercel Dashboard → Tu proyecto → "Settings" → "Domains"
2. Click "Add Domain"
3. Ingresa tu dominio (ej: `api.tudominio.com`)
4. Sigue las instrucciones para configurar DNS

### **Environment Variables**

Para agregar más variables:
1. Vercel Dashboard → Tu proyecto → "Settings" → "Environment Variables"
2. Click "Add New"
3. Ingresa nombre y valor
4. Selecciona environment (Production/Preview/Development)

### **CORS Configuration**

Si necesitas configurar CORS, crea `backend/next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

---

## 🐛 TROUBLESHOOTING

### Error: "DATABASE_URL is not defined"

**Solución:**
1. Ve a Settings → Environment Variables
2. Agrega `DATABASE_URL` con tu connection string de Neon
3. Redeploy: click "Deployments" → botón "..." → "Redeploy"

### Error: "Module not found"

**Solución:**
```bash
cd backend
npm install
git add .
git commit -m "Update dependencies"
git push
```

### Error: "Build failed"

**Solución:**
1. Verifica que Root Directory esté configurado a `backend`
2. Revisa los logs de build en Vercel
3. Prueba build local: `npm run build`

### API responde 404

**Solución:**
1. Verifica que Root Directory = `backend`
2. Verifica que las rutas son `/api/...` no `/backend/api/...`
3. Redeploy el proyecto

---

## 📊 MÉTRICAS DE ÉXITO

Después del deployment, deberías ver:

| Métrica | Valor Esperado |
|---------|----------------|
| Build Time | < 2 minutos |
| First Response | < 500ms |
| API Response | < 100ms |
| Uptime | 99.9% |
| Cold Start | < 1 segundo |

---

## 🎉 ¡DEPLOYMENT COMPLETADO!

Tu API ahora está en producción y disponible globalmente en:
```
https://tu-proyecto.vercel.app
```

### **Siguientes pasos:**

1. ✅ Comparte la URL con tu equipo
2. ✅ Actualiza documentación con la URL de producción
3. ✅ Configura monitoring (opcional)
4. ✅ Configura dominio personalizado (opcional)
5. ✅ Agrega analytics (Vercel Analytics incluido gratis)

---

## 📞 SOPORTE

- **Vercel Docs:** https://vercel.com/docs
- **Vercel Support:** https://vercel.com/support
- **Next.js Docs:** https://nextjs.org/docs

---

**¡Tu API ICD Codes está en producción! 🚀**

*Última actualización: Noviembre 8, 2025*
