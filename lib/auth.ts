import { NextAuthOptions } from 'next-auth'
import { NextApiRequest, NextApiResponse } from 'next'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'

// Extend NextAuth types
declare module 'next-auth' {
  interface User {
    id: string
    email: string
    name: string
    credits: number
    trustScore: number
    verificationTier: string
    isAdmin: boolean
  }
  
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      credits: number
      trustScore: number
      verificationTier: string
      isAdmin: boolean
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    credits: number
    trustScore: number
    verificationTier: string
    isAdmin: boolean
  }
}

// For now, we'll use JWT sessions until database connection is fully resolved
// Later we can switch to database sessions with DrizzleAdapter

// Demo users for testing
const demoUsers = [
  {
    id: '1',
    email: 'alex@stakr.app',
    name: 'Alex Rodriguez',
    password: 'password123', // Plain text for demo - will hash in authorize function
    credits: 2847.30,
    trustScore: 94,
    verificationTier: 'gold' as const,
    isAdmin: true
  },
  {
    id: '2', 
    email: 'demo@stakr.app',
    name: 'Demo User',
    password: 'demo123', // Plain text for demo - will hash in authorize function
    credits: 156.75,
    trustScore: 78,
    verificationTier: 'silver' as const,
    isAdmin: false
  }
]

export const authOptions: NextAuthOptions = {
  debug: true, // Enable debug mode to see what's happening
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

        // Find user in demo data
        const user = demoUsers.find(u => u.email === credentials.email)
        console.log('👤 User found:', !!user)
        
        if (!user) {
          console.log('❌ User not found')
          throw new Error('Invalid credentials')
        }

        // Verify password (simple comparison for demo - in production use bcrypt)
        const isValidPassword = credentials.password === user.password
        console.log('🔑 Password valid:', isValidPassword)
        
        if (!isValidPassword) {
          console.log('❌ Invalid password')
          throw new Error('Invalid credentials')
        }

        console.log('✅ Login successful for:', user.email)

        // Return user object (without password)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          credits: user.credits,
          trustScore: user.trustScore,
          verificationTier: user.verificationTier,
          isAdmin: user.isAdmin
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add custom fields to JWT token
      if (user) {
        token.credits = user.credits
        token.trustScore = user.trustScore
        token.verificationTier = user.verificationTier
        token.isAdmin = user.isAdmin
      }
      return token
    },
    async session({ session, token }) {
      // Add custom fields to session
      if (session.user && token.sub) {
        session.user.id = token.sub
        session.user.credits = token.credits
        session.user.trustScore = token.trustScore
        session.user.verificationTier = token.verificationTier
        session.user.isAdmin = token.isAdmin
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  }
} 