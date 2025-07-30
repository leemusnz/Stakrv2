import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)

// Fallback handler that returns proper JSON errors
const fallbackHandler = async (request: Request) => {
  return new Response(
    JSON.stringify({
      error: "Authentication service temporarily unavailable",
      message: "Please try again later",
    }),
    {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    },
  )
}

export default function auth(req: Request, res: Response) {
  if (req.method === "GET" || req.method === "POST") {
    return handler(req, res)
  } else {
    return fallbackHandler(req)
  }
}
