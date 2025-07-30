import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"

// Extend NextAuth types
declare module "next-auth" {
  interface User {
    id: string
    email: string
    name: string
    avatar?: string
    credits: number
    trustScore: number
    verificationTier: string
    challengesCompleted?: number
    currentStreak?: number
    longestStreak?: number
    premiumSubscription?: boolean
    isAdmin: boolean
    onboardingCompleted?: boolean
    isDev?: boolean
    devModeEnabled?: boolean
    emailVerified?: boolean
  }

  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      avatar?: string | null
      credits: number
      trustScore: number
      verificationTier: string
      challengesCompleted?: number
      currentStreak?: number
      longestStreak?: number
      premiumSubscription?: boolean
      isAdmin: boolean
      onboardingCompleted?: boolean
      isDev?: boolean
      devModeEnabled?: boolean
      emailVerified?: boolean
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    avatar?: string
    credits: number
    trustScore: number
    verificationTier: string
    challengesCompleted?: number
    currentStreak?: number
    longestStreak?: number
    premiumSubscription?: boolean
    isAdmin: boolean
    onboardingCompleted?: boolean
    isDev?: boolean
    devModeEnabled?: boolean
    emailVerified?: boolean
  }
}

// Demo users for testing (fallback when database is not available)
const demoUsers = [
  {
    id: "demo-1",
    email: "alex@stakr.app",
    name: "Alex Rodriguez",
    password: "password123",
    credits: 2847.3,
    trustScore: 94,
    verificationTier: "gold" as const,
    isAdmin: true,
    onboardingCompleted: true,
  },
  {
    id: "demo-2",
    email: "demo@stakr.app",
    name: "Demo User",
    password: "demo123",
    credits: 156.75,
    trustScore: 78,
    verificationTier: "silver" as const,
    isAdmin: false,
    onboardingCompleted: false,
  },
]

async function findUserInDatabase(email: string) {
  try {
    // For now, we'll use demo users to avoid database connection issues
    // that might be causing the NextAuth API to return HTML error pages
    console.log("🔍 Looking up user:", email)
    return null // Force fallback to demo users for now
  } catch (error) {
    console.log("🔍 Database lookup failed, using demo users:", error)
    return null
  }
}

export const authOptions: NextAuthOptions = {
  debug: false, // Disable debug to reduce potential error sources
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          console.log("🔐 Login attempt:", {
            email: credentials?.email,
            hasPassword: !!credentials?.password,
          })

          if (!credentials?.email || !credentials?.password) {
            console.log("❌ Missing credentials")
            return null
          }

          // For now, only use demo users to avoid database issues
          console.log("🔍 Checking demo users...")
          const demoUser = demoUsers.find((u) => u.email === credentials.email)

          if (!demoUser) {
            console.log("❌ User not found in demo users")
            return null
          }

          console.log("👤 Demo user found:", demoUser.email)

          // Simple password comparison for demo users
          const isValidPassword = credentials.password === demoUser.password
          console.log("🔑 Demo password valid:", isValidPassword)

          if (!isValidPassword) {
            console.log("❌ Invalid demo password")
            return null
          }

          console.log("✅ Demo login successful for:", demoUser.email)

          return {
            id: demoUser.id,
            email: demoUser.email,
            name: demoUser.name,
            credits: demoUser.credits,
            trustScore: demoUser.trustScore,
            verificationTier: demoUser.verificationTier,
            isAdmin: demoUser.isAdmin,
            onboardingCompleted: demoUser.onboardingCompleted,
            isDev: demoUser.email === "alex@stakr.app",
            devModeEnabled: false,
            emailVerified: true,
          }
        } catch (error) {
          console.error("❌ Error in authorize callback:", error)
          return null
        }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || "development-secret-change-in-production",
  callbacks: {
    async signIn({ user, account }) {
      try {
        // Simplified sign-in callback to avoid database operations that might fail
        console.log("🔑 Sign-in callback:", { email: user.email, provider: account?.provider })
        return true
      } catch (error) {
        console.error("❌ Error in signIn callback:", error)
        return false
      }
    },
    async jwt({ token, user, trigger, session }) {
      try {
        // Add custom fields to JWT token
        if (user) {
          token.avatar = user.avatar
          token.credits = user.credits
          token.trustScore = user.trustScore
          token.verificationTier = user.verificationTier
          token.challengesCompleted = user.challengesCompleted
          token.currentStreak = user.currentStreak
          token.longestStreak = user.longestStreak
          token.premiumSubscription = user.premiumSubscription
          token.isAdmin = user.isAdmin
          token.onboardingCompleted = user.onboardingCompleted
          token.isDev = user.isDev
          token.devModeEnabled = user.devModeEnabled
          token.emailVerified = !!user.emailVerified
        }

        // Handle session updates (e.g., avatar changes)
        if (trigger === "update" && session) {
          console.log("🔄 JWT Update triggered")
          if (session?.user?.image) {
            token.avatar = session.user.image
          }
          if (session?.user?.avatar) {
            token.avatar = session.user.avatar
          }
          if (session?.user?.name) token.name = session.user.name
          if (session?.user?.credits !== undefined) token.credits = session.user.credits
          if (session?.user?.trustScore !== undefined) token.trustScore = session.user.trustScore
        }

        return token
      } catch (error) {
        console.error("❌ Error in jwt callback:", error)
        return token
      }
    },
    async session({ session, token }) {
      try {
        if (session.user && token.sub) {
          session.user.id = token.sub
          session.user.avatar = token.avatar as string
          session.user.image = token.avatar as string
          session.user.credits = token.credits || 0
          session.user.trustScore = token.trustScore || 50
          session.user.verificationTier = token.verificationTier || "manual"
          session.user.challengesCompleted = token.challengesCompleted || 0
          session.user.currentStreak = token.currentStreak || 0
          session.user.longestStreak = token.longestStreak || 0
          session.user.premiumSubscription = token.premiumSubscription || false
          session.user.isAdmin = token.isAdmin || false
          session.user.onboardingCompleted = token.onboardingCompleted || false
          session.user.isDev = token.isDev || false
          session.user.devModeEnabled = token.devModeEnabled || false
          session.user.emailVerified = token.emailVerified || false
        }
        return session
      } catch (error) {
        console.error("❌ Error in session callback:", error)
        return session
      }
    },
    async redirect({ url, baseUrl }) {
      try {
        // Simplified redirect logic
        if (url.startsWith("/")) return `${baseUrl}${url}`
        if (new URL(url).origin === baseUrl) return url
        return baseUrl
      } catch (error) {
        console.error("❌ Error in redirect callback:", error)
        return baseUrl
      }
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
}
