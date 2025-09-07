# Cleanup Scattered Migration Files

After running the consolidated migration `2025-01-15_consolidate_all_schema_changes.sql`, you can safely delete the following scattered migration files from the root directory:

## Files to Delete (Consolidated into main migration):

### User-related migrations:
- `add-dev-access-columns.sql` → Consolidated
- `add-username-column.sql` → Consolidated  
- `add-xp-level-columns.sql` → Consolidated
- `email-verification-schema.sql` → Consolidated

### Challenge-related migrations:
- `add-privacy-type-column.sql` → Consolidated
- `add-team-id-column.sql` → Consolidated
- `challenge-interactions-schema.sql` → Consolidated
- `challenge-schema-migration.sql` → Consolidated

### Verification-related migrations:
- `verification-appeals-schema.sql` → Consolidated
- `fix-verification-schema.sql` → Consolidated
- `neon-verification-fix-remaining.sql` → Consolidated
- `neon-verification-schema-fix.sql` → Consolidated

### Content moderation:
- `content-moderation-schema.sql` → Consolidated

### File uploads:
- `enhanced-file-upload-schema.sql` → Consolidated

### Proof submissions:
- `proof-submission-schema.sql` → Consolidated

### AI anti-cheat:
- `ai-anti-cheat-schema.sql` → Consolidated

### Posts:
- `posts-schema-migration.sql` → Consolidated

### Production fixes:
- `PRODUCTION_FIX_EMAIL_SCHEMA_V2.sql` → Consolidated
- `PRODUCTION_FIX_EMAIL_SCHEMA.sql` → Consolidated

### OAuth fixes:
- `fix-google-oauth-user-id.sql` → Consolidated

### Legacy fixes:
- `quick-legacy-fix.sql` → Consolidated

### Admin dashboard:
- `admin-dashboard-migration.sql` → Consolidated

## Files to Keep (Not consolidated):

### Core schema files:
- `database-schema.sql` → Keep (main schema reference)
- `stakr-schema.sql` → Keep (alternative schema reference)

### Migration files in /migrations folder:
- `migrations/2025-08-10_consolidate-proof-submissions.sql` → Keep
- `migrations/2025-08-11_add_currency_tiers_settlements.sql` → Keep
- `migrations/create-integration-tables.sql` → Keep
- `migrations/2025-01-15_consolidate_all_schema_changes.sql` → Keep

## Cleanup Commands:

### PowerShell (Windows):
```powershell
# Navigate to project root
cd "G:\Stakr V2\Stakrv2-1"

# Delete consolidated migration files
Remove-Item "add-dev-access-columns.sql"
Remove-Item "add-privacy-type-column.sql"
Remove-Item "add-team-id-column.sql"
Remove-Item "add-username-column.sql"
Remove-Item "add-xp-level-columns.sql"
Remove-Item "email-verification-schema.sql"
Remove-Item "content-moderation-schema.sql"
Remove-Item "verification-appeals-schema.sql"
Remove-Item "enhanced-file-upload-schema.sql"
Remove-Item "proof-submission-schema.sql"
Remove-Item "ai-anti-cheat-schema.sql"
Remove-Item "posts-schema-migration.sql"
Remove-Item "PRODUCTION_FIX_EMAIL_SCHEMA_V2.sql"
Remove-Item "PRODUCTION_FIX_EMAIL_SCHEMA.sql"
Remove-Item "fix-google-oauth-user-id.sql"
Remove-Item "quick-legacy-fix.sql"
Remove-Item "admin-dashboard-migration.sql"
Remove-Item "challenge-interactions-schema.sql"
Remove-Item "challenge-schema-migration.sql"
Remove-Item "fix-verification-schema.sql"
Remove-Item "neon-verification-fix-remaining.sql"
Remove-Item "neon-verification-schema-fix.sql"
```

### Bash (Linux/Mac):
```bash
# Navigate to project root
cd "/path/to/Stakrv2-1"

# Delete consolidated migration files
rm add-dev-access-columns.sql
rm add-privacy-type-column.sql
rm add-team-id-column.sql
rm add-username-column.sql
rm add-xp-level-columns.sql
rm email-verification-schema.sql
rm content-moderation-schema.sql
rm verification-appeals-schema.sql
rm enhanced-file-upload-schema.sql
rm proof-submission-schema.sql
rm ai-anti-cheat-schema.sql
rm posts-schema-migration.sql
rm PRODUCTION_FIX_EMAIL_SCHEMA_V2.sql
rm PRODUCTION_FIX_EMAIL_SCHEMA.sql
rm fix-google-oauth-user-id.sql
rm quick-legacy-fix.sql
rm admin-dashboard-migration.sql
rm challenge-interactions-schema.sql
rm challenge-schema-migration.sql
rm fix-verification-schema.sql
rm neon-verification-fix-remaining.sql
rm neon-verification-schema-fix.sql
```

## Verification:

After cleanup, your project structure should look like:

```
Stakrv2-1/
├── migrations/
│   ├── README.md
│   ├── 2025-08-10_consolidate-proof-submissions.sql
│   ├── 2025-08-11_add_currency_tiers_settlements.sql
│   ├── create-integration-tables.sql
│   ├── 2025-01-15_consolidate_all_schema_changes.sql
│   └── cleanup-scattered-migrations.md
├── database-schema.sql (keep)
├── stakr-schema.sql (keep)
└── [other project files...]
```

## Benefits of Cleanup:

1. **Cleaner project structure** - No more scattered SQL files
2. **Easier maintenance** - All migrations in one organized folder
3. **Better version control** - Clear migration history
4. **Reduced confusion** - No duplicate or conflicting migrations
5. **Professional appearance** - Organized codebase

## Important Notes:

- **ONLY** delete files after successfully running the consolidated migration
- **ALWAYS** test the consolidated migration in a development environment first
- **KEEP** the core schema files (`database-schema.sql`, `stakr-schema.sql`) for reference
- **KEEP** the organized migration files in the `/migrations` folder
- **COMMIT** the cleanup changes to version control after verification
