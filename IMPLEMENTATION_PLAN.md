# ICD Code Web App - Full Implementation Plan

## Overview

Transform the existing static web application into a database-backed solution using Neon PostgreSQL, enabling users to search ICD codes, convert between ICD-10 and ICD-9, and get Elixhauser/Charlson classifications without downloading large JSON files.

## Architecture

```
┌─────────────────┐
│   Frontend      │
│  (HTML/JS/CSS)  │
└────────┬────────┘
         │
         │ HTTPS/REST API
         │
┌────────▼────────┐
│   Backend API   │
│ (Next.js/Node)  │
└────────┬────────┘
         │
         │ PostgreSQL
         │
┌────────▼────────┐
│  Neon Database  │
│   (PostgreSQL)  │
└─────────────────┘
```

## Phase 1: Database Setup ✅ (COMPLETED)

### 1.1 Database Schema Design ✅
- [x] Created comprehensive PostgreSQL schema (`database/schema.sql`)
- [x] 10 tables for codes, mappings, and metadata
- [x] Indexes for performance (prefix search, full-text search)
- [x] Views for common queries
- [x] Functions for family search and Charlson scoring

### 1.2 Data Loading Scripts ✅
- [x] Created Python data loader (`database/load_data.py`)
- [x] Loads all ICD-10/ICD-9 codes
- [x] Loads CMS GEMs mappings
- [x] Loads Elixhauser classifications
- [x] Loads Charlson mappings

### 1.3 Documentation ✅
- [x] Database setup guide
- [x] Example queries
- [x] Troubleshooting guide

## Phase 2: Backend API Development (IN PROGRESS)

### 2.1 Setup Next.js Project

**Create a new Next.js app with TypeScript:**

```bash
npx create-next-app@latest icd-web-app --typescript --tailwind --app
cd icd-web-app
```

**Install dependencies:**

```bash
npm install @neondatabase/serverless
npm install dotenv
```

### 2.2 API Endpoints to Implement

#### Endpoint: `/api/search`
- **Method**: GET
- **Parameters**: 
  - `code` (string): ICD code to search (e.g., "E10", "E10.10", "250")
  - `type` (string, optional): "icd10" or "icd9" or "auto" (default)
- **Returns**:
  ```json
  {
    "code": "E10.10",
    "system": "ICD-10-CM",
    "description": "Type 1 diabetes mellitus with ketoacidosis without coma",
    "isFamily": false,
    "familyCodes": []
  }
  ```

#### Endpoint: `/api/convert`
- **Method**: GET
- **Parameters**:
  - `code` (string): Source code
  - `from` (string): "icd10" or "icd9"
  - `to` (string): "icd9" or "icd10"
- **Returns**:
  ```json
  {
    "sourceCode": "E10.10",
    "sourceSystem": "ICD-10-CM",
    "targetSystem": "ICD-9-CM",
    "conversions": [
      {
        "code": "25010",
        "approximate": false,
        "source": "CMS_GEMs"
      }
    ]
  }
  ```

#### Endpoint: `/api/elixhauser`
- **Method**: GET
- **Parameters**: `code` (string)
- **Returns**:
  ```json
  {
    "code": "E10.10",
    "comorbidities": [
      {
        "category": "DIAB_CX",
        "name": "DIAB_CX",
        "description": "Diabetes with chronic complications"
      }
    ]
  }
  ```

#### Endpoint: `/api/charlson`
- **Method**: GET
- **Parameters**: 
  - `code` (string)
  - `system` (string, optional): "icd10" or "icd9" or "auto"
- **Returns**:
  ```json
  {
    "code": "E10.10",
    "system": "ICD-10-CM",
    "conditions": [
      {
        "condition": "Diabetes with Complications",
        "score": 2
      }
    ],
    "totalScore": 2,
    "matchType": "exact",
    "systemUsed": "ICD-10 (preferred)"
  }
  ```

#### Endpoint: `/api/family`
- **Method**: GET
- **Parameters**: `prefix` (string)
- **Returns**:
  ```json
  {
    "prefix": "E10",
    "codes": [
      {"code": "E10.0", "description": "..."},
      {"code": "E10.1", "description": "..."},
      ...
    ],
    "count": 42
  }
  ```

### 2.3 Database Connection Setup

**Create `lib/db.ts`:**

```typescript
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function query(text: string, params?: any[]) {
  try {
    const result = await sql(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}
```

### 2.4 Example API Route Implementation

**Create `app/api/search/route.ts`:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  
  if (!code) {
    return NextResponse.json({ error: 'Code parameter required' }, { status: 400 });
  }
  
  const normalizedCode = code.toUpperCase().replace(/\s/g, '');
  const isICD10 = /^[A-Z]/.test(normalizedCode);
  
  if (isICD10) {
    // Search ICD-10
    const result = await query(
      'SELECT code, description FROM icd10_codes WHERE code = $1',
      [normalizedCode]
    );
    
    if (result.length > 0) {
      return NextResponse.json({
        code: result[0].code,
        system: 'ICD-10-CM',
        description: result[0].description,
        isFamily: false
      });
    }
    
    // Try as family
    const familyResults = await query(
      'SELECT * FROM get_code_family($1) LIMIT 100',
      [normalizedCode]
    );
    
    if (familyResults.length > 0) {
      return NextResponse.json({
        code: normalizedCode,
        system: 'ICD-10-CM',
        description: `Family of ${familyResults.length} codes`,
        isFamily: true,
        familyCodes: familyResults
      });
    }
  } else {
    // Search ICD-9
    const result = await query(
      'SELECT code FROM icd9_codes WHERE code = $1',
      [normalizedCode]
    );
    
    if (result.length > 0) {
      return NextResponse.json({
        code: result[0].code,
        system: 'ICD-9-CM',
        description: 'ICD-9 code',
        isFamily: false
      });
    }
  }
  
  return NextResponse.json({ error: 'Code not found' }, { status: 404 });
}
```

## Phase 3: Frontend Updates

### 3.1 Update `web/app.js`

Replace JSON loading with API calls:

**Before:**
```javascript
const data = await fetch('data/icd10_to_icd9.json');
```

**After:**
```javascript
const response = await fetch(`/api/convert?code=${code}&from=icd10&to=icd9`);
const data = await response.json();
```

### 3.2 Implement API Integration

**Create `web/api-client.js`:**

```javascript
const API_BASE = '/api'; // Or your deployed API URL

export async function searchCode(code) {
  const response = await fetch(`${API_BASE}/search?code=${encodeURIComponent(code)}`);
  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }
  return response.json();
}

export async function convertCode(code, from, to) {
  const response = await fetch(
    `${API_BASE}/convert?code=${encodeURIComponent(code)}&from=${from}&to=${to}`
  );
  if (!response.ok) {
    throw new Error(`Conversion failed: ${response.statusText}`);
  }
  return response.json();
}

export async function getElixhauser(code) {
  const response = await fetch(`${API_BASE}/elixhauser?code=${encodeURIComponent(code)}`);
  if (!response.ok) {
    throw new Error(`Elixhauser query failed: ${response.statusText}`);
  }
  return response.json();
}

export async function getCharlson(code, system = 'auto') {
  const response = await fetch(
    `${API_BASE}/charlson?code=${encodeURIComponent(code)}&system=${system}`
  );
  if (!response.ok) {
    throw new Error(`Charlson query failed: ${response.statusText}`);
  }
  return response.json();
}

export async function getCodeFamily(prefix) {
  const response = await fetch(`${API_BASE}/family?prefix=${encodeURIComponent(prefix)}`);
  if (!response.ok) {
    throw new Error(`Family query failed: ${response.statusText}`);
  }
  return response.json();
}
```

### 3.3 Update Main Search Logic

Refactor `handleSearch()` function to use API:

```javascript
import { searchCode, convertCode, getElixhauser, getCharlson, getCodeFamily } from './api-client.js';

async function handleSearch(code) {
  try {
    showLoading();
    
    // Search for code
    const searchResult = await searchCode(code);
    
    // If it's a family, expand it
    let codes = [searchResult];
    if (searchResult.isFamily) {
      const familyResult = await getCodeFamily(code);
      codes = familyResult.codes;
    }
    
    // Convert codes
    const conversions = await Promise.all(
      codes.map(c => convertCode(c.code, searchResult.system, targetSystem))
    );
    
    // Get Elixhauser
    const elixhauser = await Promise.all(
      codes.map(c => getElixhauser(c.code))
    );
    
    // Get Charlson
    const charlson = await Promise.all(
      codes.map(c => getCharlson(c.code))
    );
    
    // Display results
    displayResults({ codes, conversions, elixhauser, charlson });
    
    hideLoading();
  } catch (error) {
    showError(error.message);
    hideLoading();
  }
}
```

## Phase 4: Deployment

### 4.1 Deploy to Vercel (Recommended)

1. **Push code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit with Neon database backend"
   git branch -M main
   git remote add origin your-repo-url
   git push -u origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repo
   - Add environment variable: `DATABASE_URL` with your Neon connection string
   - Deploy

### 4.2 Alternative: Deploy to Netlify + Separate API

If you want to keep the static frontend:

1. **Deploy API separately** (e.g., on Railway, Render, or Vercel)
2. **Update frontend** to point to deployed API URL
3. **Deploy frontend** to Netlify

### 4.3 Environment Variables

Set these in your deployment platform:

- `DATABASE_URL`: Your Neon PostgreSQL connection string
- `NODE_ENV`: `production`

## Phase 5: Testing & Optimization

### 5.1 Testing Checklist

- [ ] Test code search (ICD-10 and ICD-9)
- [ ] Test family expansion (E10, I50, etc.)
- [ ] Test ICD-10 → ICD-9 conversion
- [ ] Test ICD-9 → ICD-10 conversion
- [ ] Test Elixhauser classification
- [ ] Test Charlson index calculation
- [ ] Test history functionality
- [ ] Test on mobile devices
- [ ] Load testing with concurrent users

### 5.2 Performance Optimization

**Database:**
- Monitor query performance in Neon dashboard
- Add additional indexes if needed
- Consider caching frequently accessed data

**API:**
- Implement response caching (e.g., with Vercel Edge Cache)
- Add rate limiting to prevent abuse
- Optimize database queries

**Frontend:**
- Lazy load results
- Implement pagination for large family searches
- Add loading states and skeleton screens

### 5.3 Monitoring

- Set up error tracking (e.g., Sentry)
- Monitor API response times
- Track database query performance
- Monitor Neon database metrics

## Phase 6: Future Enhancements

### 6.1 User Accounts
- [ ] Implement authentication
- [ ] Save persistent search history per user
- [ ] Allow users to create "code sets"

### 6.2 Advanced Features
- [ ] Batch code processing (upload CSV)
- [ ] Export results to PDF/Excel
- [ ] Advanced search with filters
- [ ] Code suggestion/autocomplete

### 6.3 API Improvements
- [ ] GraphQL API for complex queries
- [ ] Public API with API keys
- [ ] WebSocket for real-time updates
- [ ] Bulk conversion endpoints

## Key Files Summary

```
ICD10-ICD9-codes-conversion/
├── database/
│   ├── schema.sql             # ✅ Database schema
│   ├── load_data.py           # ✅ Data loading script
│   ├── requirements.txt       # ✅ Python dependencies
│   ├── .env.example           # ✅ Environment template
│   └── README.md              # ✅ Setup guide
├── web/                       # Existing static frontend
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   └── docs.html
├── api/                       # 🚧 TO CREATE: Next.js API routes
│   ├── search/
│   ├── convert/
│   ├── elixhauser/
│   ├── charlson/
│   └── family/
├── lib/                       # 🚧 TO CREATE: Utilities
│   └── db.ts
└── IMPLEMENTATION_PLAN.md     # ✅ This file
```

## Next Immediate Steps

1. **✅ Set up Neon database** (use `database/` files)
2. **🚧 Create Next.js project structure**
3. **🚧 Implement API endpoints**
4. **🚧 Update frontend to call API**
5. **🚧 Test thoroughly**
6. **🚧 Deploy to Vercel**

## Timeline Estimate

- **Phase 1 (Database)**: ✅ COMPLETED
- **Phase 2 (Backend API)**: 2-3 days
- **Phase 3 (Frontend Updates)**: 1-2 days
- **Phase 4 (Deployment)**: 1 day
- **Phase 5 (Testing)**: 1-2 days
- **Total**: ~1 week for MVP

## Questions & Decisions

### Decision: Frontend Framework
- **Option A**: Keep existing HTML/JS/CSS + separate API
- **Option B**: Rebuild with Next.js (integrated frontend + API)
- **Recommendation**: Option B (Next.js) for easier maintenance and deployment

### Decision: Data Refresh Strategy
- **Option A**: Manual refresh (run `load_data.py` when needed)
- **Option B**: Automated scheduled refresh
- **Recommendation**: Start with Option A, implement Option B later

### Decision: Caching Strategy
- **Option A**: No caching (always fresh data)
- **Option B**: Cache API responses for X hours
- **Recommendation**: Option B with 24-hour cache for most queries

## Support & Resources

- **Neon**: https://neon.tech/docs
- **Next.js**: https://nextjs.org/docs
- **Vercel**: https://vercel.com/docs
- **PostgreSQL**: https://www.postgresql.org/docs/

---

**Status**: Phase 1 complete. Ready to proceed with Phase 2.
**Last Updated**: November 7, 2025
