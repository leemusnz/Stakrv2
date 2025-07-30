import { neon } from "@neondatabase/serverless"

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

let connection: any = null

export async function createDbConnection() {
  try {
    if (!connection) {
      connection = neon(process.env.DATABASE_URL!)
      console.log("✅ Database connection initialized")
    }
    return connection
  } catch (error) {
    console.error("❌ Failed to create database connection:", error)
    throw new Error("Database connection failed")
  }
}

// Database utilities
export const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production",
}

// Connection health check
export async function checkConnection(): Promise<boolean> {
  try {
    const db = await createDbConnection()
    await db`SELECT 1`
    return true
  } catch (error) {
    console.error("Database health check failed:", error)
    return false
  }
}
