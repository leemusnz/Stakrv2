import { neon } from "@neondatabase/serverless"

let sql: any = null

export async function createDbConnection() {
  try {
    if (!sql && process.env.DATABASE_URL) {
      sql = neon(process.env.DATABASE_URL)
      console.log("✅ Database connection created")
    }
    return sql
  } catch (error) {
    console.error("❌ Database connection failed:", error)
    throw new Error("Database connection failed")
  }
}

// Simple fallback for when database is not available
export const db = {
  user: {
    findUnique: async () => null,
    create: async () => null,
    update: async () => null,
  },
}
