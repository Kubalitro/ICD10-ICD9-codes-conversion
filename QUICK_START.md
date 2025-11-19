# Quick Start Guide

This guide will get you up and running with the ICD code conversion app using Neon PostgreSQL in **under 30 minutes**.

## 🎯 What You'll Build

A web application that:
- ✅ Converts ICD-10 ↔ ICD-9 codes
- ✅ Classifies codes using Elixhauser comorbidities (31 categories)
- ✅ Calculates Charlson Comorbidity Index scores
- ✅ Searches code families (e.g., E10 for all Type 1 Diabetes codes)
- ✅ No large files to download - all data in cloud database

## ⚡ Prerequisites

- [Neon account](https://neon.tech) (free tier is perfect)
- Python 3.7+ installed
- Node.js 18+ installed (for Next.js)

## 📋 Step-by-Step Setup

### Step 1: Set Up Neon Database (10 min)

1. **Create Neon Project**
   ```bash
   # Go to https://console.neon.tech
   # Click "Create Project"
   # Name: icd-codes-db
   # Region: Choose closest to you
   ```

2. **Copy Connection String**
   ```bash
   # In Neon dashboard, copy your connection string
   # Example: postgresql://user:pass@ep-xxx.region.aws.neon.tech/db?sslmode=require
   ```

3. **Create Database Schema**
   ```bash
   # Option A: Using psql
   psql "your_connection_string" < database/schema.sql
   
   # Option B: In Neon SQL Editor
   # Copy/paste contents of database/schema.sql and click "Run"
   ```

### Step 2: Load Data (5 min)

1. **Install Python Dependencies**
   ```bash
   cd database
   pip install -r requirements.txt
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env and add your DATABASE_URL
   ```

3. **Generate JSON Files** (if needed)
   ```bash
   cd ..
   python process_data.py
   ```

4. **Load Data to Neon**
   ```bash
   cd database
   python load_data.py
   ```

   Expected output:
   ```
   ✓ Loaded 75,000 ICD-10-CM codes
   ✓ Loaded 15,000 ICD-9-CM codes
   ✓ Loaded 70,000+ mappings
   ✓ Data loading completed successfully!
   ```

### Step 3: Test Database (2 min)

```bash
# Connect to your database
psql "your_connection_string"

# Run test queries
SELECT COUNT(*) FROM icd10_codes;
-- Should return ~75,000

SELECT * FROM get_code_family('E10') LIMIT 5;
-- Should return E10.0, E10.1, E10.10, etc.

SELECT * FROM get_charlson_score_icd10('E10.10');
-- Should return: Diabetes with Complications, score 2
```

## 🚀 What's Next?

You now have a fully populated Neon database with all ICD codes, mappings, and classifications!

### Option A: Use Existing Static Frontend (Quick Test)

The current web app loads JSON files. You can test it works:

```bash
# Make sure JSON files exist
python process_data.py

# Open web/index.html in browser
# Or use a simple server:
cd web
python -m http.server 8000
# Visit http://localhost:8000
```

### Option B: Build API-Powered Web App (Recommended)

Follow the [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) to:

1. Create Next.js app with API routes
2. Connect to Neon database
3. Build REST API endpoints
4. Update frontend to call API
5. Deploy to Vercel

**Estimated time**: 1-2 days for full implementation

## 📊 Database Statistics

After loading, you should have:

| Table | Rows |
|-------|------|
| icd10_codes | ~75,000 |
| icd9_codes | ~15,000 |
| icd10_to_icd9_mapping | ~70,000 |
| icd9_to_icd10_mapping | ~70,000 |
| elixhauser_mappings | ~4,500 |
| charlson_icd10_mappings | ~280 |
| charlson_icd9_mappings | ~190 |

**Total database size**: ~50-100 MB

## 🧪 Example Queries

### Search for a code:
```sql
SELECT code, description 
FROM icd10_codes 
WHERE code = 'E10.10';
```

### Get all Type 1 Diabetes codes:
```sql
SELECT * FROM get_code_family('E10');
```

### Convert ICD-10 to ICD-9:
```sql
SELECT 
    ic.code as icd10,
    ic.description,
    m.icd9_code,
    m.approximate
FROM icd10_codes ic
JOIN icd10_to_icd9_mapping m ON ic.code = m.icd10_code
WHERE ic.code = 'E10.10';
```

### Get Elixhauser comorbidities:
```sql
SELECT 
    em.icd10_code,
    ec.name,
    ec.description
FROM elixhauser_mappings em
JOIN elixhauser_categories ec ON em.category_code = ec.code
WHERE em.icd10_code = 'E10.10';
```

### Get Charlson score:
```sql
SELECT * FROM get_charlson_score_icd10('E10.10');
-- Returns: Diabetes with Complications, score 2
```

### Search by description (fuzzy):
```sql
SELECT code, description
FROM icd10_codes
WHERE description ILIKE '%diabetes%ketoacidosis%'
LIMIT 10;
```

## 💡 Pro Tips

1. **Free Tier Limits**: Neon's free tier is perfect for this project:
   - 10 GB storage (you'll use ~100 MB)
   - 100 hours compute time per month
   - Unlimited projects

2. **Connection Pooling**: For production, use connection pooling:
   ```typescript
   // In Next.js with @neondatabase/serverless
   const pool = neon(DATABASE_URL, { 
     pooled: true 
   });
   ```

3. **Caching**: Consider caching frequent queries:
   - Code lookups rarely change
   - Cache for 24 hours
   - Use Vercel Edge Cache or Redis

4. **Performance**: The database has indexes for:
   - Prefix searches (code families)
   - Full-text search (descriptions)
   - Fast joins on mappings

## 🆘 Troubleshooting

### "Connection refused"
- Check your DATABASE_URL is correct
- Ensure `sslmode=require` is in the URL
- Verify you can access https://console.neon.tech

### "Foreign key violation"
- Run schema.sql before load_data.py
- Make sure all source files exist

### "JSON files not found"
- Run `python process_data.py` first

### Slow queries
- Check Neon dashboard for query performance
- Verify indexes are created (they're in schema.sql)
- Consider adding `LIMIT` to large queries

## 📚 Resources

- **Full Implementation Guide**: [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)
- **Database Setup Details**: [database/README.md](./database/README.md)
- **Neon Docs**: https://neon.tech/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

## ✅ Checklist

- [ ] Created Neon account and project
- [ ] Copied connection string
- [ ] Ran schema.sql to create tables
- [ ] Installed Python dependencies
- [ ] Created .env file with DATABASE_URL
- [ ] Ran process_data.py to generate JSON files
- [ ] Ran load_data.py successfully
- [ ] Tested with sample queries
- [ ] Ready to build API (see IMPLEMENTATION_PLAN.md)

## 🎉 Success!

Your ICD codes database is now live on Neon! 

**Next steps:**
1. Read [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for API development
2. Check [database/README.md](./database/README.md) for advanced queries
3. Start building your web app frontend

---

**Questions?** Check the [database/README.md](./database/README.md) or open an issue on GitHub.

**Last Updated**: November 7, 2025
