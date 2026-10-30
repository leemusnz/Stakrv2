#!/usr/bin/env bash
# Build an EMPTY Postgres database that matches the Stakr production schema.
#
#   scripts/db-rebuild-from-baseline.sh postgresql://user:pass@host:5432/stakr_dev
#
# Use for local development, CI, staging and disaster-recovery rehearsals.
# Safety rails (this script must never be able to damage production):
#   - the database name must end in _dev, _test, _local or _staging
#   - the database must be empty (no `users` table)
# The baseline already includes everything up to the 27/09/2026 lifecycle
# migrations. Apply any later files from migrations/ on top, in date order.
set -euo pipefail

url="${1:-${DATABASE_URL:-}}"
if [[ -z "$url" ]]; then
  echo "usage: $0 <postgres-url>   (or set DATABASE_URL)" >&2
  exit 2
fi

dbname="${url##*/}"
dbname="${dbname%%\?*}"
if [[ ! "$dbname" =~ _(dev|test|local|staging)$ ]]; then
  echo "refusing: database name '$dbname' must end in _dev, _test, _local or _staging" >&2
  exit 3
fi

if [[ "$(psql "$url" -X -tAc "select to_regclass('public.users') is not null")" == "t" ]]; then
  echo "refusing: '$dbname' already has a users table. Drop and recreate the database first." >&2
  exit 4
fi

here="$(cd "$(dirname "$0")/.." && pwd)"
for part in "$here"/migrations/baseline/2026-10-30_live-schema-0{1,2,3}-*.sql; do
  echo "applying $(basename "$part")"
  psql "$url" -X -q -v ON_ERROR_STOP=1 -f "$part" >/dev/null
done

echo "baseline applied: $(psql "$url" -X -tAc "select count(*) from information_schema.tables where table_schema='public' and table_type='BASE TABLE'") tables"
