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
    console.log("🔍 Looking up user in database:", email)
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
      console.log("❌ User not found in database:", email)
      return null
    }
    
    console.log("✅ User found in database:", email)
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
          console.log("🔐 Login attempt:", {
            email: credentials?.email,
            hasPassword: !!credentials?.password,
          })

          if (!credentials?.email || !credentials?.password) {
            console.log("❌ Missing credentials")
            return null
          }

          // First, try to find user in database
          console.log("🔍 Checking database users...")
          const dbUser = await findUserInDatabase(credentials.email)
          
          if (dbUser) {
            console.log("👤 Database user found:", dbUser.email)
            
            // Check if this is an OAuth-only account (no password_hash)
            if (!dbUser.password_hash) {
              console.log("🔍 Account exists but has no password - likely OAuth account")
              // Return a special error to indicate OAuth account
              throw new Error("OAUTH_ACCOUNT_EXISTS")
            }
            
            // Verify password (assuming bcrypt hashing)
            let isValidPassword = false
            try {
              const bcrypt = await import('bcryptjs')
              isValidPassword = await bcrypt.compare(credentials.password, dbUser.password_hash)
            } catch (bcryptError) {
              console.log("⚠️ bcrypt not available, trying plain text comparison")
              // Fallback to plain text for development
              isValidPassword = credentials.password === dbUser.password_hash
            }
            
            console.log("🔑 Database password valid:", isValidPassword)

            if (!isValidPassword) {
              console.log("❌ Invalid database password")
              return null
            }

            console.log("✅ Database login successful for:", dbUser.email)

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
          console.log("🔍 Checking demo users as fallback...")
          const demoUser = demoUsers.find((u) => u.email === credentials.email)

          if (!demoUser) {
            console.log("❌ User not found in database or demo users")
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
          
          // Handle OAuth account exists error
          if (error instanceof Error && error.message === "OAUTH_ACCOUNT_EXISTS") {
            console.log("🔍 OAuth account detected, throwing special error")
            throw error // Re-throw to be caught by NextAuth
          }
          
          return null
        }
      },
    }),
    CredentialsProvider({
      id: "verification",
      name: "verification",
      credentials: {
        email: { label: "Email", type: "email" },
        userId: { label: "User ID", type: "text" },
      },
      async authorize(credentials) {
        console.log("🚨 VERIFICATION PROVIDER CALLED! 🚨")
        try {
          console.log("🔐 Verification sign-in attempt:", {
            email: credentials?.email,
            userId: credentials?.userId,
          })
          console.log("🔐 All credentials received:", credentials)

          if (!credentials?.email || !credentials?.userId) {
            console.log("❌ Missing verification credentials")
            console.log("❌ Email provided:", !!credentials?.email)
            console.log("❌ UserId provided:", !!credentials?.userId)
            return null
          }

          // Find user in database
          const dbUser = await findUserInDatabase(credentials.email)
          
          console.log("🔐 Database user lookup result:", {
            found: !!dbUser,
            email: dbUser?.email,
            userId: dbUser?.id,
            emailVerified: dbUser?.email_verified,
            expectedUserId: credentials.userId,
            userIdMatch: dbUser?.id === credentials.userId
          })
          
          if (dbUser && dbUser.id === credentials.userId && dbUser.email_verified) {
            console.log("✅ Verification sign-in successful for:", dbUser.email)
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

          console.log("❌ Verification sign-in failed")
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
  secret: process.env.NEXTAUTH_SECRET || "development-secret-change-in-production",
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        console.log("🔑 Sign-in callback:", { 
          email: user.email, 
          provider: account?.provider,
          accountType: account?.type,
          userId: user.id 
        })
        
        // OAuth providers (Google, etc.) have already verified the email
        if (account?.type === 'oauth') {
          console.log("✅ OAuth user - email pre-verified by", account.provider)
          
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
              console.log("🆕 Creating new OAuth user:", user.email)
              
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
              
              console.log("✅ OAuth user created:", newUsers[0].email)
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
                  console.log('🎯 Awarded 50 XP for OAuth signup to user:', user.email)
                } else {
                  console.log('⚠️ XP already awarded for OAuth signup to user:', user.email)
                }
              } catch (xpError) {
                console.error('❌ Failed to award XP for OAuth signup:', xpError)
                // Don't fail signup if XP award fails
              }
            } else {
              console.log("✅ OAuth user exists:", existingUsers[0].email)
              user.id = existingUsers[0].id
              
              // Update email verification if not set
              if (!existingUsers[0].email_verified) {
                await sql`
                  UPDATE users 
                  SET email_verified = true, email_verified_at = NOW() 
                  WHERE email = ${user.email}
                `
                console.log("✅ Updated email verification for existing user")
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
              console.log("📊 Loading full user data for OAuth:", dbUser.email)
              
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
              
              console.log("✅ Full user data loaded for OAuth:", {
                isDev: user.isDev,
                isAdmin: user.isAdmin,
                devModeEnabled: user.devModeEnabled
              })
            }
          } catch (dbError) {
            console.error("❌ Database error during OAuth user creation:", dbError)
            // Don't block sign-in for database errors
          }
          
          // Mark OAuth users as email verified since the provider already did this
          user.emailVerified = true
        }
        
        console.log("✅ Sign-in approved for:", user.email)
        return true
      } catch (error) {
        console.error("❌ Error in signIn callback:", error)
        
        // Handle OAuth account exists error
        if (error instanceof Error && error.message === "OAUTH_ACCOUNT_EXISTS") {
          console.log("🔍 OAuth account conflict detected")
          // Return a special error URL parameter
          return `/auth/signin?error=oauth_account_exists&email=${encodeURIComponent(user?.email || '')}`
        }
        
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
          if (session?.user?.onboardingCompleted !== undefined) {
            token.onboardingCompleted = session.user.onboardingCompleted
            console.log("🔄 Updated onboardingCompleted in token:", session.user.onboardingCompleted)
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
        console.log("🔄 Redirect callback:", { url, baseUrl })
        // Allow any redirect to the same origin
        if (url.startsWith("/")) {
          const redirectUrl = `${baseUrl}${url}`
          console.log("✅ Relative redirect:", redirectUrl)
          return redirectUrl
        }
        // Allow full URLs on same origin
        if (new URL(url).origin === baseUrl) {
          console.log("✅ Same origin redirect:", url)
          return url
        }
        console.log("🔄 Default redirect to baseUrl:", baseUrl)
        return baseUrl
      } catch (error) {
        console.error("❌ Error in redirect callback:", error)
        console.log("🔄 Fallback redirect to baseUrl:", baseUrl)
        return baseUrl
      }
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
}
