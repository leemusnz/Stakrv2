import { NextAuthOptions } from 'next-auth'
import { NextApiRequest, NextApiResponse } from 'next'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { createDbConnection } from '@/lib/db'
import { systemLogger } from '@/lib/system-logger'

// Extend NextAuth types
declare module 'next-auth' {
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

declare module 'next-auth/jwt' {
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

// For now, we'll use JWT sessions until database connection is fully resolved
// Later we can switch to database sessions with DrizzleAdapter

// Demo users for testing (fallback when database is not available)
const demoUsers = [
  {
    id: 'demo-1',
    email: 'alex@stakr.app',
    name: 'Alex Rodriguez',
    password: 'password123',
    credits: 2847.30,
    trustScore: 94,
    verificationTier: 'gold' as const,
    isAdmin: true,
    onboardingCompleted: true
  },
  {
    id: 'demo-2', 
    email: 'demo@stakr.app',
    name: 'Demo User',
    password: 'demo123',
    credits: 156.75,
    trustScore: 78,
    verificationTier: 'silver' as const,
    isAdmin: false,
    onboardingCompleted: false
  }
]

async function findUserInDatabase(email: string) {
  try {
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
        false_claims,
        current_streak,
        longest_streak,
        premium_subscription,
        premium_expires_at,
        email_verified,
        email_verified_at,
        onboarding_completed,
        is_dev,
        dev_mode_enabled,
        has_dev_access,
        created_at,
        updated_at
      FROM users 
      WHERE email = ${email}
      LIMIT 1
    `
    
    return users.length > 0 ? users[0] : null
  } catch (error) {
    console.log('🔍 Database lookup failed, falling back to demo users:', error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('🔐 Login attempt:', { 
          email: credentials?.email, 
          hasPassword: !!credentials?.password 
        })
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials')
          throw new Error('Missing credentials')
        }

        // First, try to find user in database
        const dbUser = await findUserInDatabase(credentials.email)
        
        if (dbUser) {
          console.log('👤 Database user found:', dbUser.email)
          
          // Verify password with bcrypt
          const isValidPassword = await bcrypt.compare(credentials.password, dbUser.password_hash)
          console.log('🔑 Database password valid:', isValidPassword)
          
                    if (!isValidPassword) {
            console.log('❌ Invalid database password')
            throw new Error('Invalid credentials')
          }

          // Check if email is verified (boolean field)
          console.log('📧 Email verification status:', { 
            email: dbUser.email, 
            email_verified: dbUser.email_verified,
            email_verified_at: dbUser.email_verified_at,
            isVerified: dbUser.email_verified === true 
          })
          
          if (dbUser.email_verified !== true) {
            console.log('🚫 Login denied for unverified email:', dbUser.email)
            throw new Error('error=email_not_verified')
          }

          console.log('✅ Database login successful for:', dbUser.email)
          systemLogger.info(`Database login successful for user: ${dbUser.email}`, 'auth')

          // Check if user is suspended (false_claims >= 3)
          if (dbUser.false_claims >= 3) {
            console.log('🚫 User is suspended:', dbUser.email, 'false_claims:', dbUser.false_claims) 
            throw new Error('error=suspended')
          }

          return {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            avatar: dbUser.avatar_url,
            credits: parseFloat(dbUser.credits) || 0,
            trustScore: dbUser.trust_score || 50,
            verificationTier: dbUser.verification_tier || 'manual',
            challengesCompleted: dbUser.challenges_completed || 0,
            currentStreak: dbUser.current_streak || 0,
            longestStreak: dbUser.longest_streak || 0,
            premiumSubscription: dbUser.premium_subscription || false,
            isAdmin: dbUser.has_dev_access || dbUser.is_dev || false, // Check both fields
            onboardingCompleted: dbUser.onboarding_completed || false,
            isDev: dbUser.is_dev || false,
            devModeEnabled: dbUser.dev_mode_enabled || false,
            emailVerified: dbUser.email_verified === true
          }
        }

        // Fallback to demo users if database lookup failed
        console.log('🔍 Checking demo users...')
        const demoUser = demoUsers.find(u => u.email === credentials.email)
        
        if (!demoUser) {
          console.log('❌ User not found in database or demo users')
          throw new Error('Invalid credentials')
        }

        console.log('👤 Demo user found:', demoUser.email)
        
        // Simple password comparison for demo users
        const isValidPassword = credentials.password === demoUser.password
        console.log('🔑 Demo password valid:', isValidPassword)
        
        if (!isValidPassword) {
          console.log('❌ Invalid demo password')
          throw new Error('Invalid credentials')
        }

        console.log('✅ Demo login successful for:', demoUser.email)
        systemLogger.info(`Demo login successful for user: ${demoUser.email}`, 'auth')

        return {
          id: demoUser.id,
          email: demoUser.email,
          name: demoUser.name,
          credits: demoUser.credits,
          trustScore: demoUser.trustScore,
          verificationTier: demoUser.verificationTier,
          isAdmin: demoUser.isAdmin,
          onboardingCompleted: demoUser.onboardingCompleted,
          isDev: demoUser.email === 'alex@stakr.app', // Grant dev access to admin
          devModeEnabled: false,
          emailVerified: true // Demo users are always verified
        }
      }
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET
      })
    ] : [])
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'development-secret-change-in-production',
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
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
      if (trigger === 'update') {
        console.log('🔄 JWT Update triggered:', { trigger, session })
        if (session?.user?.image) {
          token.avatar = session.user.image
          console.log('✅ JWT token avatar updated to:', session.user.image)
        }
        if (session?.user?.avatar) {
          token.avatar = session.user.avatar
          console.log('✅ JWT token avatar updated to:', session.user.avatar)
        }
        // Handle other profile updates
        if (session?.user?.name) token.name = session.user.name
        if (session?.user?.credits !== undefined) token.credits = session.user.credits
        if (session?.user?.trustScore !== undefined) token.trustScore = session.user.trustScore
      }
      
      // Handle Google OAuth user creation
      if (account?.provider === 'google' && user) {
        try {
          // Check if user exists in database
          const existingUser = await findUserInDatabase(user.email!)
          
          if (!existingUser) {
            // Create new user from Google OAuth
            const sql = await createDbConnection()
            const newUsers = await sql`
              INSERT INTO users (
                email, 
                name, 
                avatar_url,
                credits, 
                trust_score, 
                verification_tier,
                email_verified,
                created_at,
                updated_at
              ) VALUES (
                ${user.email},
                ${user.name},
                ${user.image},
                0.00,
                50,
                'manual',
                NOW(),
                NOW(),
                NOW()
              )
              RETURNING id, credits, trust_score, verification_tier, has_dev_access
            `
            
            const newUser = newUsers[0]
            token.credits = parseFloat(newUser.credits)
            token.trustScore = newUser.trust_score
            token.verificationTier = newUser.verification_tier
            token.challengesCompleted = 0
            token.currentStreak = 0
            token.longestStreak = 0
            token.premiumSubscription = false
            token.isAdmin = newUser.has_dev_access || newUser.is_dev || false // Check both fields
            
            console.log('✅ Google OAuth user created:', user.email)
          } else {
            // Use existing user's admin status
            token.isAdmin = existingUser.has_dev_access || existingUser.is_dev || false
          }
        } catch (error) {
          console.log('⚠️ Failed to create Google OAuth user:', error)
        }
      }
      
      return token
    },
    async session({ session, token }) {
      // Add custom fields to session
      if (session.user && token.sub) {
        session.user.id = token.sub
        
        // Always fetch the latest data from database to ensure persistence
        let latestAvatar = token.avatar as string
        let latestIsAdmin = token.isAdmin || false
        let latestIsDev = token.isDev || false
        
        try {
          if (session.user.email) {
            const dbUser = await findUserInDatabase(session.user.email)
            if (dbUser) {
              // Check if user is suspended during active session
              if (dbUser.false_claims >= 3) {
                console.log('🚫 User suspended during active session:', dbUser.email)
                // Invalidate the session by returning null
                throw new Error('Session terminated: Account suspended')
              }
              
              // Check if email was unverified during active session
              if (dbUser.email_verified !== true) {
                console.log('🚫 User email unverified during active session:', dbUser.email)
                throw new Error('Session terminated: Email not verified')
              }
              
              if (dbUser.avatar_url) {
                latestAvatar = dbUser.avatar_url
                console.log('📸 Latest avatar fetched from database:', latestAvatar)
              }
              
              // Update admin status from database
              latestIsAdmin = dbUser.has_dev_access || dbUser.is_dev || false
              latestIsDev = dbUser.is_dev || false
              

              
              // Update token with latest data for future sessions
              token.avatar = latestAvatar
              token.isAdmin = latestIsAdmin
              token.isDev = latestIsDev
            }
          }
        } catch (error) {
          console.log('⚠️ Could not fetch latest data from database, using token values')
          // If the error is about suspension, we should not continue
          if (error instanceof Error && error.message.includes('suspended')) {
            throw error
          }
        }
        
        // Synchronize avatar and image fields with latest data
        session.user.avatar = latestAvatar
        session.user.image = latestAvatar  // NextAuth standard field
        
        session.user.credits = token.credits || 0
        session.user.trustScore = token.trustScore || 50
        session.user.verificationTier = token.verificationTier || 'manual'
        session.user.challengesCompleted = token.challengesCompleted || 0
        session.user.currentStreak = token.currentStreak || 0
        session.user.longestStreak = token.longestStreak || 0
        session.user.premiumSubscription = token.premiumSubscription || false
        session.user.isAdmin = latestIsAdmin  // Use refreshed admin status
        session.user.onboardingCompleted = token.onboardingCompleted || false
        session.user.isDev = latestIsDev  // Use refreshed dev status
        session.user.devModeEnabled = token.devModeEnabled || false
        session.user.emailVerified = token.emailVerified || false
        

      }
      return session
    },
        async redirect({ url, baseUrl }) {
      // Handle custom redirects for suspended users
      if (url.includes('error=suspended') || url.includes('account%20suspended')) {
        return `${baseUrl}/auth/suspended`
      }

      // Handle email not verified error
      if (url.includes('error=email_not_verified') || url.includes('email%20not%20verified')) {
        return `${baseUrl}/auth/verify-email`
      }

      // Default redirect logic
      if (url.startsWith('/')) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  }
}
