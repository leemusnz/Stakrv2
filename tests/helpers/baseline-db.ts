import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "pg";

/**
 * Builds the REAL production schema (migrations/baseline) into a throwaway
 * schema of a dedicated *_test database, so acceptance tests exercise the same
 * tables, constraints, triggers and functions as production instead of a
 * hand-written approximation.
 */
export async function createBaselineSchema(
  databaseUrl: string,
  schema: string,
) {
  const url = new URL(databaseUrl);
  if (!url.pathname.endsWith("_test"))
    throw new Error("Use a dedicated database ending in _test");
  const admin = new Pool({ connectionString: databaseUrl });
  await admin.query(`CREATE SCHEMA ${schema}`);
  url.searchParams.set("options", `-c search_path=${schema},public`);
  const scoped = url.toString();
  const db = new Pool({ connectionString: scoped });
  const dir = join(process.cwd(), "migrations/baseline");
  for (const file of readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort())
    // The captured trigger/function DDL is qualified "public."; retarget it so the
    // test schema is self-contained and never writes to the shared public schema.
    await db.query(
      readFileSync(join(dir, file), "utf8").replaceAll("public.", schema + "."),
    );
  return {
    db,
    scopedUrl: scoped,
    async drop() {
      await db.end();
      await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
      await admin.end();
    },
  };
}
