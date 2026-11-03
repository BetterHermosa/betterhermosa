# Build Scripts Documentation

This directory contains automation, maintenance, and build scripts for the Better LB project.

## Overview

Scripts in this directory handle:
- Service data merging
- Sitemap generation
- Build automation
- Data validation
- **Database migrations**

---

## Database Migration Scripts

### `migrate.sh`

Automated D1 database migration management with safety checks and tracking.

**Purpose:**
Manages database schema changes across local, preview, and production environments with automatic migration tracking and safety verification.

**Features:**
- ✅ Automatic migration discovery and execution
- ✅ Migration state tracking (applied vs pending)
- ✅ Safety checks (DROP TABLE, UPDATE/DELETE without WHERE)
- ✅ Production confirmation prompts
- ✅ Status reporting across environments
- ✅ CI/CD integration

**Usage:**

```bash
# Run migrations on local database
npm run db:migrate
# or: ./scripts/migrate.sh local

# Run migrations on production (with confirmation)
npm run db:migrate:remote
# or: ./scripts/migrate.sh remote

# Check migration status
npm run db:migrate:status
# or: ./scripts/migrate.sh status

# Create new migration file
npm run db:migrate:create <migration_name>
# or: ./scripts/migrate.sh create <migration_name>

# Verify migration safety
./scripts/migrate.sh verify
```

**Migration Tracking:**
- `schema_migrations` table tracks applied migrations
- Migration files in `db/migrations/` with numeric prefixes
- Skips already-applied migrations automatically

**See `docs/DATABASE-MIGRATION-AUTOMATION.md` for complete guide.**

---

## Scripts

### `merge_services.py`

Merges category-based service files into a single services JSON file.

**Purpose:**
The service directory is split into manageable category files for easier maintenance.
This script combines them into a single file that the application loads at runtime.

**Input:**
- `src/data/services/categories/*.json` - Individual category files

**Output:**
- `src/data/services/services.json` - Merged services array

**Usage:**
```bash
python3 scripts/merge_services.py
```

**When to Run:**
- Before starting development server (`npm run dev`)
- Before building for production (`npm run build`)
- After modifying any service category file

**Process:**
1. Reads all `.json` files from `src/data/services/categories/`
2. Combines arrays into a single list
3. Sorts alphabetically by service name
4. Writes to `src/data/services/services.json`

---

### `generate-sitemap.js`

Generates an XML sitemap for search engines.

**Purpose:**
Creates a sitemap.xml file listing all pages on the site, improving SEO.

**Output:**
- `public/sitemap.xml` - Sitemap for search engines

**Usage:**
```bash
node scripts/generate-sitemap.js
```

**Automated:**
Run automatically during the build process.

---

### `fetch-budget.js`

Snapshots national-government projects located in Hermosa from the [Philippine Budget Data API](https://budget.bettergov.ph/docs) for the `/budget` page.

**Output:**
- `public/data/budget-hermosa.json` - GAA FY2020-2026 projects plus the FY2027 NEP vs House bill rows (DPWH and farm-to-market roads). Committed to the repo.

**Usage:**
```bash
node scripts/fetch-budget.js
```

**Automated:**
Runs during `npm run build`, before `generate-sitemap.js`. If the API is unreachable the previous snapshot is kept and the build continues.

**Caveats:**
- The API has no municipality field, so projects are matched by the word "Hermosa" in the title (with a deny list for "Villahermosa" and other provinces' Hermosa). Projects that don't name Hermosa are missed.
- These are national projects, not the municipality's own budget.
- NEP and House figures are two versions of one budget: never add them. The API's disclaimers are copied into the JSON and must stay on any page showing House bill rows.
- Refresh by re-running the script and committing the JSON; the data changes a few times a year.

---

### `extract_blgf.py`

Extracts Hermosa's rows from the BLGF fiscal data spreadsheets into `src/data/finances/hermosa.json` for the `/finances` page.

**Usage:**
```bash
pip install openpyxl
python scripts/extract_blgf.py <folder-with-the-three-xlsx-files>
```

**Not automated:** blgf.gov.ph blocks scripted downloads, so download the files in a browser first. The script checks column headers and that the parts add up. See [docs/local-finances.md](../docs/local-finances.md).

---

### `extract_boundaries.py`

Extracts Hermosa's 23 barangay boundaries from the Philippine Barangay Boundaries release into `src/data/geo/hermosa-barangays.json` for the barangay map.

**Usage:**
```bash
python scripts/extract_boundaries.py            # downloads the ~8 MB release zip
python scripts/extract_boundaries.py bundle.zip # or use a local copy
```

**Not automated:** the boundaries change rarely. See [docs/barangay-map.md](../docs/barangay-map.md).

---

## Service Data Structure

### Category File Format

Each category file in `src/data/services/categories/` follows this structure:

```json
[
  {
    "service": "Business Permit Renewal",
    "slug": "business-permit-renewal",
    "type": "transaction",
    "category": {
      "name": "Business",
      "slug": "business"
    },
    "description": "Annual renewal of business permits...",
    "steps": [
      "Step 1: Prepare requirements",
      "Step 2: Submit application"
    ],
    "requirements": [
      "Previous year's permit",
      "Barangay clearance"
    ],
    "quickInfo": {
      "fee": "Varies by business size",
      "processingTime": "3-5 working days",
      "whoCanApply": "Business owners"
    },
    "updatedAt": "2024-01-15T10:00:00Z"
  }
]
```

### Schema Validation

All services must conform to the schema at `src/data/schema/services.schema.json`.

**Required Fields:**
- `service` - Service name
- `slug` - URL-friendly identifier
- `category` - Category object with `name` and `slug`
- `updatedAt` - ISO 8601 timestamp

---

## Creating a New Service Category

1. Create a new JSON file in `src/data/services/categories/`:
   ```bash
   touch src/data/services/categories/new-category.json
   ```

2. Add services following the schema:
   ```json
   [
     {
       "service": "Service Name",
       "slug": "service-name",
       "category": {
         "name": "New Category",
         "slug": "new-category"
       },
       "updatedAt": "2024-01-15T10:00:00Z"
     }
   ]
   ```

3. Run the merge script:
   ```bash
   python3 scripts/merge_services.py
   ```

4. Verify the output:
   ```bash
   cat src/data/services/services.json | jq '.[] | select(.category.slug == "new-category")'
   ```

---

## Troubleshooting

### "Module not found" errors

Ensure Python 3 is installed:
```bash
python3 --version
```

### Merge script produces empty file

Check that:
- Category files contain valid JSON
- Files are in the correct directory
- Files have `.json` extension

### Services not appearing in the app

1. Run the merge script
2. Check the output file exists
3. Restart the development server
4. Clear browser cache

---

## Validation

### Validate Service JSON

```bash
# Install ajv-cli
npm install -g ajv-cli

# Validate against schema
ajv validate -s src/data/schema/services.schema.json -d src/data/services/services.json
```

---

## Automation in Build Process

The merge script is integrated into the build process:

```json
{
  "scripts": {
    "build": "tsc && npm run merge:data && vite build",
    "merge:data": "python3 scripts/merge_services.py"
  }
}
```

This ensures services are always merged before building.

---

## Contributing

When adding new scripts:

1. Add documentation to this README
2. Include usage examples
3. Document input/output formats
4. Add error handling

---

## Related Documentation

- [Services Schema](../src/data/schema/services.schema.json)
- [Services Data](../src/data/services/README.md)
- [Build Documentation](../README.md#build-process)
