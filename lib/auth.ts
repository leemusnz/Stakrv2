import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { nextAuthSecret } from "@/lib/nextauth-secret"

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
    xp?: number
    level?: number
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
      xp?: number
      level?: number
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
    xp?: number
    level?: number
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
    const { createDbConnection } = await import('@/lib/db')
    const sql = await createDbConnection()
    
    const users = await sql`
      SELECT 
        id, 
        email, 
        name, 
        password_hash,
        avatar_url,
        credits,
        trust_score,
        verification_tier,
        challenges_completed,
        current_streak,
        longest_streak,
        premium_subscription,
        email_verified,
        onboarding_completed,
        xp,
        level,
        is_dev,
        dev_mode_enabled
      FROM users 
      WHERE email = ${email}
      LIMIT 1
    `
    
    if (users.length === 0) {
      return null
    }
    
    return users[0]
  } catch (error) {
    console.error("❌ Database lookup failed:", error)
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

          if (!credentials?.email || !credentials?.password) {
            return null
          }

          // In development, allow known demo credentials to sign in reliably
          // even if a database user record with the same email exists.
          const isDevEnvironment = process.env.NODE_ENV === "development"
          if (isDevEnvironment) {
            const demoUser = demoUsers.find((u) => u.email === credentials.email)
            if (demoUser && credentials.password === demoUser.password) {
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
            }
          }

          // First, try to find user in database
          const dbUser = await findUserInDatabase(credentials.email)
          
          if (dbUser) {
            
            // Check if this is an OAuth-only account (no password_hash)
            // This check is critical to prevent bcrypt.compare() from being called with null/undefined
            if (!dbUser.password_hash || dbUser.password_hash === null || dbUser.password_hash === undefined || dbUser.password_hash === '') {
              // Return a special error to indicate OAuth account
              throw new Error("OAUTH_ACCOUNT_EXISTS")
            }
            
            // Additional safety check before bcrypt comparison
            if (typeof dbUser.password_hash !== 'string' || dbUser.password_hash.trim() === '') {
              throw new Error("OAUTH_ACCOUNT_EXISTS")
            }
            
            // Verify password (assuming bcrypt hashing)
            let isValidPassword = false
            try {
              const bcrypt = await import('bcryptjs')
              // Additional safety: ensure password_hash is valid before comparison
              if (!dbUser.password_hash || typeof dbUser.password_hash !== 'string') {
                throw new Error("OAUTH_ACCOUNT_EXISTS")
              }
              isValidPassword = await bcrypt.compare(credentials.password, dbUser.password_hash)
            } catch (bcryptError) {
              // If bcrypt error is due to invalid hash, treat as OAuth account
              if (bcryptError instanceof Error && (
                bcryptError.message.includes('Invalid salt version') ||
                bcryptError.message.includes('data and hash arguments required')
              )) {
                throw new Error("OAUTH_ACCOUNT_EXISTS")
              }
              // Fallback to plain text for development (only if hash exists)
              if (dbUser.password_hash && typeof dbUser.password_hash === 'string') {
                isValidPassword = credentials.password === dbUser.password_hash
              } else {
                throw new Error("OAUTH_ACCOUNT_EXISTS")
              }
            }
            

            if (!isValidPassword) {
              return null
            }


            return {
              id: dbUser.id,
              email: dbUser.email,
              name: dbUser.name,
              avatar: dbUser.avatar_url || null,
              credits: parseFloat(dbUser.credits) || 0,
              trustScore: dbUser.trust_score || 50,
              verificationTier: dbUser.verification_tier || 'manual',
              challengesCompleted: dbUser.challenges_completed || 0,
              currentStreak: dbUser.current_streak || 0,
              longestStreak: dbUser.longest_streak || 0,
              premiumSubscription: dbUser.premium_subscription || false,
              isAdmin: dbUser.email === 'alex@stakr.app', // Admin check
              onboardingCompleted: dbUser.onboarding_completed || false,
              isDev: dbUser.is_dev || false,
              devModeEnabled: dbUser.dev_mode_enabled || false,
              emailVerified: dbUser.email_verified || false,
              xp: dbUser.xp || 0,
              level: dbUser.level || 1,
            }
          }

          // Fallback to demo users if not found in database
          const demoUser = demoUsers.find((u) => u.email === credentials.email)

          if (!demoUser) {
            return null
          }


          // Simple password comparison for demo users
          const isValidPassword = credentials.password === demoUser.password

          if (!isValidPassword) {
            return null
          }


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
          
          // Handle OAuth account exists error
          if (error instanceof Error && error.message === "OAUTH_ACCOUNT_EXISTS") {
            throw error // Re-throw to be caught by NextAuth
          }
          
          return null
        }
      },
    }),
    CredentialsProvider({
      name: "verification",
      credentials: {
        email: { label: "Email", type: "email" },
        userId: { label: "User ID", type: "text" },
      },
      async authorize(credentials) {
        try {

          if (!credentials?.email || !credentials?.userId) {
            return null
          }

          // Find user in database
          const dbUser = await findUserInDatabase(credentials.email)
          
          if (dbUser && dbUser.id === credentials.userId && dbUser.email_verified) {
            return {
              id: dbUser.id,
              email: dbUser.email,
              name: dbUser.name,
              avatar: dbUser.avatar_url,
              emailVerified: dbUser.email_verified,
              onboardingCompleted: dbUser.onboarding_completed,
              credits: parseFloat(dbUser.credits) || 0,
              trustScore: dbUser.trust_score || 50,
              verificationTier: dbUser.verification_tier || 'manual',
              challengesCompleted: dbUser.challenges_completed || 0,
              currentStreak: dbUser.current_streak || 0,
              longestStreak: dbUser.longest_streak || 0,
              premiumSubscription: dbUser.premium_subscription || false,
              isAdmin: dbUser.is_dev || dbUser.has_dev_access || dbUser.email === 'alex@stakr.app',
              isDev: dbUser.is_dev || false,
              devModeEnabled: dbUser.dev_mode_enabled || false,
              xp: dbUser.xp || 0,
              level: dbUser.level || 1,
            }
          }

          return null
        } catch (error) {
          console.error("❌ Error in verification authorize:", error)
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
  secret: nextAuthSecret(),
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        
        // OAuth providers (Google, etc.) have already verified the email
        if (account?.type === 'oauth') {
          
          // Create OAuth user in database if they don't exist
          try {
            const { createDbConnection } = await import('@/lib/db')
            const sql = await createDbConnection()
            
            // Check if user exists
            const existingUsers = await sql`
              SELECT id, email, email_verified FROM users 
              WHERE email = ${user.email}
            `
            
            if (existingUsers.length === 0) {
              // Create new OAuth user
              
              // Generate username from email
              const emailPrefix = user.email!.split('@')[0].toLowerCase()
              let username = emailPrefix.replace(/[^a-z0-9]/g, '')
              
              // Ensure minimum length
              if (username.length < 3) {
                username = emailPrefix.slice(0, 3) + Math.random().toString(36).slice(2, 5)
              }
              
              const newUsers = await sql`
                INSERT INTO users (
                  email, 
                  name,
                  username,
                  avatar_url,
                  credits, 
                  trust_score, 
                  verification_tier,
                  challenges_completed,
                  false_claims,
                  current_streak,
                  longest_streak,
                  premium_subscription,
                  email_verified,
                  email_verified_at,
                  onboarding_completed,
                  created_at,
                  updated_at
                ) VALUES (
                  ${user.email},
                  ${user.name || 'New User'},
                  ${username},
                  ${user.image || null},
                  0.00,
                  50,
                  'manual',
                  0,
                  0,
                  0,
                  0,
                  false,
                  true,
                  NOW(),
                  false,
                  NOW(),
                  NOW()
                )
                RETURNING id, email, name, username
              `
              
              user.id = newUsers[0].id
              
              // Award XP for OAuth signup (equivalent to email verification)
              try {
                const xpAwardResult = await sql`
                  SELECT award_xp(
                    ${user.id}::UUID,
                    50,
                    'oauth_signup',
                    NULL,
                    'OAuth signup completed - Welcome to Stakr!'
                  )
                `
                
                if (xpAwardResult[0]?.award_xp) {
                } else {
                }
              } catch (xpError) {
                console.error('❌ Failed to award XP for OAuth signup:', xpError)
                // Don't fail signup if XP award fails
              }
            } else {
              user.id = existingUsers[0].id
              
              // Update email verification if not set
              if (!existingUsers[0].email_verified) {
                await sql`
                  UPDATE users 
                  SET email_verified = true, email_verified_at = NOW() 
                  WHERE email = ${user.email}
                `
              }
            }
            
            // Load full user data from database for both new and existing users
            const fullUserData = await sql`
              SELECT 
                id, 
                email, 
                name,
                avatar_url,
                credits,
                trust_score,
                verification_tier,
                challenges_completed,
                current_streak,
                longest_streak,
                premium_subscription,
                email_verified,
                onboarding_completed,
                xp,
                level,
                is_dev,
                dev_mode_enabled,
                has_dev_access
              FROM users 
              WHERE email = ${user.email}
            `
            
            if (fullUserData.length > 0) {
              const dbUser = fullUserData[0]
              
              // Set all user properties from database
              user.avatar = dbUser.avatar_url || null
              user.credits = parseFloat(dbUser.credits) || 0
              user.trustScore = dbUser.trust_score || 50
              user.verificationTier = dbUser.verification_tier || 'manual'
              user.challengesCompleted = dbUser.challenges_completed || 0
              user.currentStreak = dbUser.current_streak || 0
              user.longestStreak = dbUser.longest_streak || 0
              user.premiumSubscription = dbUser.premium_subscription || false
              user.isAdmin = dbUser.is_dev || dbUser.has_dev_access || dbUser.email === 'alex@stakr.app'
              user.onboardingCompleted = dbUser.onboarding_completed || false
              user.isDev = dbUser.is_dev || false
              user.devModeEnabled = dbUser.dev_mode_enabled || false
              user.emailVerified = dbUser.email_verified || false
              user.xp = dbUser.xp || 0
              user.level = dbUser.level || 1
              
            }
          } catch (dbError) {
            console.error("❌ Database error during OAuth user creation:", dbError)
            // Don't block sign-in for database errors
          }
          
          // Mark OAuth users as email verified since the provider already did this
          user.emailVerified = true
        }
        
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
          token.xp = user.xp
          token.level = user.level
          // For OAuth users, emailVerified is set to true in signIn callback
          token.emailVerified = Boolean(user.emailVerified)
        }

        // Handle session updates (e.g., avatar changes)
        if (trigger === "update" && session) {
          if (session?.user?.image) {
            token.avatar = session.user.image
          }
          if (session?.user?.avatar) {
            token.avatar = session.user.avatar
          }
          if (session?.user?.name) token.name = session.user.name
          if (session?.user?.credits !== undefined) token.credits = session.user.credits
          if (session?.user?.trustScore !== undefined) token.trustScore = session.user.trustScore
          if (session?.user?.onboardingCompleted !== undefined) {
            token.onboardingCompleted = session.user.onboardingCompleted
          }
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
          session.user.xp = token.xp || 0
          session.user.level = token.level || 1
        }
        return session
      } catch (error) {
        console.error("❌ Error in session callback:", error)
        return session
      }
    },
    async redirect({ url, baseUrl }) {
      try {
        // Allow any redirect to the same origin
        if (url.startsWith("/")) {
          const redirectUrl = `${baseUrl}${url}`
          return redirectUrl
        }
        // Allow full URLs on same origin
        if (new URL(url).origin === baseUrl) {
          return url
        }
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
