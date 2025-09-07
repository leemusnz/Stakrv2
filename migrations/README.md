# Stakr Database Migrations

This directory contains all database migration files for the Stakr application.

## Migration Files

### Current Migrations (in chronological order):

1. **`2025-08-10_consolidate-proof-submissions.sql`**
   - Consolidates proof_submissions schema across app and AI anti-cheat
   - Adds AI analysis column to challenges table
   - Ensures all required proof submission columns exist

2. **`2025-08-11_add_currency_tiers_settlements.sql`**
   - Creates settlements table for recording distribution summaries
   - Creates webhook_events table for Stripe webhook event store
   - Adds currency and stake tiers metadata support

3. **`create-integration-tables.sql`**
   - Creates integration-related tables for third-party services

4. **`2025-01-15_consolidate_all_schema_changes.sql`** ⭐ **LATEST**
   - **COMPREHENSIVE CONSOLIDATION** of all scattered migration files
   - Includes all pending schema changes in one migration
   - Adds XP/Level system, dev access, username support, verification tokens
   - Creates all missing tables and indexes
   - **RECOMMENDED**: Run this migration to apply all pending changes

## Migration Status

### ✅ Applied Migrations:
- `2025-08-10_consolidate-proof-submissions.sql`
- `2025-08-11_add_currency_tiers_settlements.sql`
- `create-integration-tables.sql`

### 🔄 Pending Migration:
- `2025-01-15_consolidate_all_schema_changes.sql` - **RUN THIS NEXT**

## How to Apply Migrations

### For Development:
1. Copy the migration SQL content
2. Paste into your Neon SQL Editor
3. Execute the migration
4. Verify the changes with the included verification queries

### For Production:
1. **ALWAYS** test migrations on a staging environment first
2. Run migrations during low-traffic periods
3. Monitor for any errors or performance issues
4. Keep backups before running migrations

## Consolidated Migration Benefits

The `2025-01-15_consolidate_all_schema_changes.sql` migration consolidates the following scattered files:

### Root Directory Files (now consolidated):
- `add-dev-access-columns.sql` → Dev access columns
- `add-privacy-type-column.sql` → Privacy type support
- `add-team-id-column.sql` → Team ID support
- `add-username-column.sql` → Username support
- `add-xp-level-columns.sql` → XP/Level system
- `email-verification-schema.sql` → Verification tokens
- `content-moderation-schema.sql` → Moderation tables
- `verification-appeals-schema.sql` → Appeals system
- And many more...

### Benefits:
- ✅ **Single migration** instead of 20+ scattered files
- ✅ **Idempotent** - safe to run multiple times
- ✅ **Comprehensive** - includes all pending changes
- ✅ **Well-documented** - includes comments and verification queries
- ✅ **Organized** - follows proper migration naming convention

## After Running Consolidated Migration

Once you run the consolidated migration, you can safely delete the scattered migration files from the root directory:

```bash
# These files can be deleted after running the consolidated migration:
rm add-dev-access-columns.sql
rm add-privacy-type-column.sql
rm add-team-id-column.sql
rm add-username-column.sql
rm add-xp-level-columns.sql
rm email-verification-schema.sql
rm content-moderation-schema.sql
rm verification-appeals-schema.sql
# ... and other scattered .sql files
```

## Migration Naming Convention

All future migrations should follow this pattern:
```
YYYY-MM-DD_descriptive_name.sql
```

Examples:
- `2025-01-15_consolidate_all_schema_changes.sql`
- `2025-01-20_add_new_feature.sql`
- `2025-01-25_fix_performance_issue.sql`

## Verification

Each migration includes verification queries at the end to ensure:
- All tables were created successfully
- All columns were added correctly
- All indexes were created
- Data integrity is maintained

## Rollback Strategy

For production environments, always have a rollback plan:
1. Keep backups before migrations
2. Document rollback steps for complex changes
3. Test rollback procedures in staging
4. Consider using database migration tools for complex scenarios

---

**Next Steps:**
1. Run `2025-01-15_consolidate_all_schema_changes.sql` in your Neon SQL Editor
2. Verify all changes were applied successfully
3. Delete the scattered migration files from the root directory
4. Update your deployment process to use the organized migrations folder
