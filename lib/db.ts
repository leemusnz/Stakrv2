import { neon } from "@neondatabase/serverless"

let db: any = null

export function createDbConnection() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set")
  }

  if (!db) {
    db = neon(process.env.DATABASE_URL)
  }

  return db
}

export async function testDatabaseConnection() {
  try {
    const sql = createDbConnection()
    const result = await sql`SELECT 1 as test`
    console.log("✅ Database connection successful")
    return { success: true, message: "Database connection successful" }
  } catch (error) {
    console.error("❌ Database connection failed:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export { db }
