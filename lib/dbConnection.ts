import { neon } from "@neondatabase/serverless"

let connection: any = null

export function createDbConnection() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set")
  }

  if (!connection) {
    connection = neon(process.env.DATABASE_URL)
  }

  return connection
}

export async function testConnection() {
  try {
    const sql = createDbConnection()
    await sql`SELECT 1`
    return true
  } catch (error) {
    console.error("Database connection test failed:", error)
    return false
  }
}

export default createDbConnection
