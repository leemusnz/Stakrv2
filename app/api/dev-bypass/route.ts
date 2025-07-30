import { NextResponse } from "next/server"

export async function POST() {
  try {
    if (process.env.NODE_ENV !== "development" && !process.env.VERCEL_URL?.includes("vercel.app")) {
      return NextResponse.json(
        { success: false, error: "Dev bypass only available in development" },
        { status: 403, headers: { "Content-Type": "application/json" } },
      )
    }

    const response = NextResponse.json(
      { success: true, message: "Development bypass successful" },
      { status: 200, headers: { "Content-Type": "application/json" } },
    )

    // Set the alpha access cookie
    response.cookies.set("alpha_access", "true", {
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      secure: false, // Don't require HTTPS in development
      sameSite: "lax",
      httpOnly: false, // Allow client-side access for debugging
    })

    return response
  } catch (error) {
    console.error("💥 Dev bypass error:", error)
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: "Method not allowed" },
    { status: 405, headers: { "Content-Type": "application/json" } },
  )
}
