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

export async function testDatabaseConnection(): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const db = await createDbConnection()
    if (!db) {
      return {
        success: false,
        error: "Failed to create database connection",
      }
    }

    // Test the connection with a simple query
    const result = await db`SELECT 1 as test`
    console.log("✅ Database connection test successful:", result)
    return {
      success: true,
      message: "Database connection and query successful!",
    }
  } catch (error) {
    console.error("❌ Database connection test failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown database error",
    }
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
