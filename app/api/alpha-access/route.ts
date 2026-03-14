import { type NextRequest, NextResponse } from "next/server"

// Alpha access password - change this to your desired password
const ALPHA_PASSWORD = process.env.ALPHA_ACCESS_PASSWORD || "stakr_alpha_2023"

export async function POST(request: NextRequest) {
  try {

    // Parse request body safely
    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error("❌ Failed to parse request body:", error)
      return NextResponse.json(
        { success: false, error: "Invalid request format" },
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    const { password } = body

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Access code required" },
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    // Check if password matches
    if (password === ALPHA_PASSWORD) {

      // Create response with success
      const response = NextResponse.json(
        { success: true, message: "Alpha access granted" },
        { status: 200, headers: { "Content-Type": "application/json" } },
      )

      // Set the cookie server-side (this ensures it's set before redirect)
      // Environment-aware cookie settings for better compatibility
      const isProduction = process.env.NODE_ENV === "production"
      const isHttps = request.url.startsWith("https://")
      
      response.cookies.set("alpha_access", "true", {
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        secure: isProduction && isHttps, // Only secure in production with HTTPS
        sameSite: "lax", // Use 'lax' for better mobile browser compatibility
        httpOnly: false, // Allow client-side access for mobile browsers
      })

      return response
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid access code. Please check your code and try again." },
        { status: 401, headers: { "Content-Type": "application/json" } },
      )
    }
  } catch (error) {
    console.error("💥 Alpha access verification error:", error)
    return NextResponse.json(
      { success: false, error: "Server error. Please try again." },
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { success: false, error: "Method not allowed" },
    { status: 405, headers: { "Content-Type": "application/json" } },
  )
}
