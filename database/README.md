# Database Setup Guide for Neon PostgreSQL

This guide will help you set up the ICD codes database on Neon PostgreSQL.

## Prerequisites

- **Neon Account**: Sign up at [https://neon.tech](https://neon.tech) (free tier available)
- **Python 3.7+**: For running the data loading scripts
- **Required Python packages**: Install with `pip install -r requirements.txt`

## Step-by-Step Setup

### 1. Create a Neon Database

1. Go to [https://console.neon.tech](https://console.neon.tech)
2. Click **"Create Project"**
3. Choose a name for your project (e.g., `icd-codes-db`)
4. Select a region (choose closest to your users)
5. Click **"Create Project"**

### 2. Get Your Connection String

1. In the Neon dashboard, find your connection string
2. It should look like:
   ```
   postgresql://username:password@ep-xxxxx.region.aws.neon.tech/dbname?sslmode=require
   ```
3. Copy this connection string

### 3. Configure Environment Variables

1. Create a `.env` file in the `database/` directory:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Neon connection string:
   ```bash
   DATABASE_URL=postgresql://your_connection_string
   ```

### 4. Create Database Schema

Run the schema creation script in your Neon SQL Editor or using psql:

```bash
# Option 1: Using psql command line
psql "postgresql://your_connection_string" < schema.sql

# Option 2: Copy and paste the contents of schema.sql into Neon SQL Editor
```

In the Neon web console:
1. Go to **SQL Editor**
2. Copy the contents of `schema.sql`
3. Paste and click **"Run"**

### 5. Install Python Dependencies

```bash
pip install psycopg2-binary pandas openpyxl python-dotenv
```

Or using requirements file:
```bash
cd database
pip install -r requirements.txt
```

### 6. Generate Charlson JSON Files (if not already done)

```bash
cd ..
python process_data.py
```

This will create JSON files in `web/data/` needed by the loader.

### 7. Load Data into Neon

```bash
cd database
python load_data.py
```

This process will:
- Load ~75,000 ICD-10-CM codes
- Load ~15,000 ICD-9-CM codes
- Load ~70,000+ conversion mappings
- Load ~4,500 Elixhauser mappings
- Load ~470 Charlson mappings
- Verify the data

**Expected output:**
```
==============================================
ICD Code Database Loader for Neon PostgreSQL
==============================================

Connecting to Neon database...
  ✓ Connected successfully

=== Loading ICD-10-CM codes ===
  ✓ Loaded 75,000 ICD-10-CM codes

=== Loading ICD-9-CM codes ===
  ✓ Loaded 15,000 ICD-9-CM codes

...

=== Verifying data ===
  icd10_codes: 75,000 rows
  icd9_codes: 15,000 rows
  ...

✓ Data loading completed successfully!
==============================================
```

## Database Structure

### Tables

1. **icd10_codes** - ICD-10-CM codes with descriptions
2. **icd9_codes** - ICD-9-CM codes
3. **icd10_to_icd9_mapping** - Conversion mappings (ICD-10 → ICD-9)
4. **icd9_to_icd10_mapping** - Conversion mappings (ICD-9 → ICD-10)
5. **elixhauser_categories** - 39 Elixhauser comorbidity categories
6. **elixhauser_mappings** - ICD-10 codes mapped to Elixhauser categories
7. **charlson_categories** - 18 Charlson comorbidity categories with scores
8. **charlson_icd10_mappings** - ICD-10 codes mapped to Charlson conditions
9. **charlson_icd9_mappings** - ICD-9 codes mapped to Charlson conditions
10. **metadata** - Version and source information

### Useful Views

- **v_icd10_complete** - ICD-10 codes with Elixhauser categories
- **v_icd10_to_icd9_complete** - Complete conversion from ICD-10 to ICD-9
- **v_icd9_to_icd10_complete** - Complete conversion from ICD-9 to ICD-10

### Useful Functions

- **get_code_family(prefix)** - Get all codes in a family (e.g., `get_code_family('E10')`)
- **get_charlson_score_icd10(code)** - Get Charlson score for an ICD-10 code
- **get_charlson_score_icd9(code)** - Get Charlson score for an ICD-9 code

## Example Queries

### Search for a specific code:
```sql
SELECT * FROM icd10_codes WHERE code = 'E10.10';
```

### Get all codes in E10 family:
```sql
SELECT * FROM get_code_family('E10');
```

### Convert ICD-10 to ICD-9:
```sql
SELECT 
    ic.code,
    ic.description,
    m.icd9_code,
    m.approximate
FROM icd10_codes ic
JOIN icd10_to_icd9_mapping m ON ic.code = m.icd10_code
WHERE ic.code = 'E10.10';
```

### Get Elixhauser comorbidities for a code:
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
```

### Search codes by description (fuzzy):
```sql
SELECT code, description
FROM icd10_codes
WHERE description ILIKE '%diabetes%ketoacidosis%'
LIMIT 10;
```

## Testing the Database

After loading, test with these sample queries:

```bash
# Connect to your database
psql "your_connection_string"

# Test queries
SELECT COUNT(*) FROM icd10_codes;
SELECT * FROM get_code_family('E10') LIMIT 5;
SELECT * FROM get_charlson_score_icd10('E10.10');
```

## Maintenance

### Updating Data

When new ICD code versions are released:

1. Download new files from:
   - [CMS ICD-10-CM](https://www.cms.gov/medicare/coding-billing/icd-10-codes)
   - [AHRQ Elixhauser](https://hcup-us.ahrq.gov/toolssoftware/comorbidityicd10/comorbidity_icd10.jsp)

2. Replace files in project root

3. Regenerate JSON files:
   ```bash
   python process_data.py
   ```

4. Clear and reload database:
   ```bash
   # In Neon SQL Editor or psql:
   TRUNCATE TABLE icd10_to_icd9_mapping CASCADE;
   TRUNCATE TABLE icd9_to_icd10_mapping CASCADE;
   TRUNCATE TABLE elixhauser_mappings CASCADE;
   TRUNCATE TABLE charlson_icd10_mappings CASCADE;
   TRUNCATE TABLE charlson_icd9_mappings CASCADE;
   TRUNCATE TABLE icd10_codes CASCADE;
   TRUNCATE TABLE icd9_codes CASCADE;
   
   # Then reload:
   python load_data.py
   ```

### Backup

Neon provides automatic backups. You can also export data:

```bash
# Export to SQL file
pg_dump "your_connection_string" > backup.sql

# Restore from SQL file
psql "your_connection_string" < backup.sql
```

## Troubleshooting

### Connection Issues

**Error: "could not connect to server"**
- Check that your connection string is correct
- Ensure you're using `sslmode=require`
- Verify your IP is not blocked (Neon's free tier is accessible from anywhere)

**Error: "password authentication failed"**
- Double-check your connection string
- Regenerate password in Neon dashboard if needed

### Data Loading Issues

**Error: "foreign key violation"**
- Make sure tables are created in the correct order (run schema.sql first)
- Check that all source files exist

**Error: "JSON files not found"**
- Run `python process_data.py` first to generate Charlson JSON files

### Performance

For optimal performance:
- Use connection pooling for web applications (e.g., `pg-pool` or `pgBouncer`)
- Create additional indexes if needed for your specific queries
- Monitor query performance in Neon dashboard

## Next Steps

After setting up the database, you can:

1. **Build API endpoints** - See `../api/` directory (to be created)
2. **Update frontend** - Modify `../web/app.js` to call API instead of loading JSON
3. **Deploy** - Use Vercel, Netlify, or your preferred hosting platform

## Resources

- [Neon Documentation](https://neon.tech/docs/introduction)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Psycopg2 Documentation](https://www.psycopg.org/docs/)
- [ICD-10-CM Official Guidelines](https://www.cms.gov/medicare/coding-billing/icd-10-codes)

## Support

For issues specific to:
- **Neon**: [Neon Community](https://community.neon.tech/)
- **ICD Codes**: [CMS Support](https://www.cms.gov/medicare/regulations-guidance/administrative-simplification/code-sets)
- **This Project**: Open an issue on GitHub
