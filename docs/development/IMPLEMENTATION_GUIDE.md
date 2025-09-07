# 🚀 Stakr Implementation Guide

## Phase 1: Environment & Database Setup

### Step 1: Environment Variables

Create `.env.local` file in your project root:

\`\`\`bash
# ================================
# 🔧 CORE APPLICATION SETTINGS
# ================================
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-nextauth-key-minimum-32-characters

# ================================
# 🗄️ DATABASE (Neon PostgreSQL)
# ================================
# Get from: https://console.neon.tech/
DATABASE_URL=postgresql://username:password@ep-example.us-east-1.aws.neon.tech/stakrdb?sslmode=require

# ================================
# 💳 PAYMENTS (Stripe)
# ================================
# Get from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ================================
# 📧 EMAIL SERVICES
# ================================
# Option 1: Resend (Recommended)
RESEND_API_KEY=re_...

# ================================
# ☁️ FILE STORAGE (AWS S3)
# ================================
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_BUCKET_NAME=stakr-uploads

# ================================
# 🚀 FEATURE FLAGS
# ================================
NEXT_PUBLIC_ENABLE_REAL_PAYMENTS=false
NEXT_PUBLIC_ENABLE_AI_VERIFICATION=false
NEXT_PUBLIC_ENABLE_MOCK_DATA=true
\`\`\`

### Step 2: Database Setup (Neon)

1. **Create Neon Account**: Go to [console.neon.tech](https://console.neon.tech/)
2. **Create Database**: 
   - Project name: `stakr-production`
   - Database name: `stakrdb`
   - Region: Choose closest to your users
3. **Get Connection String**: Copy the connection string from Neon dashboard
4. **Add to Environment**: Paste into your `.env.local` as `DATABASE_URL`

### Step 3: Initialize Database Schema

\`\`\`bash
# Generate migration files
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Open database studio (optional)
npm run db:studio
\`\`\`

### Step 4: Test Database Connection

Create a test API route to verify database connectivity:

**File: `app/api/test-db/route.ts`**
\`\`\`typescript
import { NextResponse } from 'next/server'
import { testDatabaseConnection } from '@/lib/db'

export async function GET() {
  try {
    const result = await testDatabaseConnection()
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Database connected successfully!' 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Database connection failed' 
    }, { status: 500 })
  }
}
\`\`\`

**Test**: Navigate to `http://localhost:3000/api/test-db`

---

## Phase 2: Authentication Setup

### Step 1: NextAuth Configuration

**File: `lib/auth.ts`**
\`\`\`typescript
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Implementation coming next...
        return null
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
  },
})
\`\`\`

### Step 2: Authentication API Routes

**File: `app/api/auth/[...nextauth]/route.ts`**
\`\`\`typescript
import { handlers } from "@/lib/auth"

export const { GET, POST } = handlers
\`\`\`

---

## Phase 3: Core API Implementation

### Step 1: User Management APIs

**File: `app/api/user/profile/route.ts`**
\`\`\`typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db, users } from '@/lib/db'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1)

    if (!user.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user[0])
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
\`\`\`

### Step 2: Challenge Management APIs

**File: `app/api/challenges/route.ts`**
\`\`\`typescript
import { NextRequest, NextResponse } from 'next/server'
import { db, challenges } from '@/lib/db'
import { desc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = db.select().from(challenges)
    
    if (category) {
      query = query.where(eq(challenges.category, category))
    }

    const challengeList = await query
      .orderBy(desc(challenges.createdAt))
      .limit(limit)

    return NextResponse.json(challengeList)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
\`\`\`

---

## Phase 4: Payment Integration

### Step 1: Stripe Setup

**File: `lib/stripe.ts`**
\`\`\`typescript
import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
})
\`\`\`

### Step 2: Credit Purchase API

**File: `app/api/payments/purchase-credits/route.ts`**
\`\`\`typescript
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount } = await request.json()

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: 'usd',
      metadata: {
        type: 'credit_purchase',
        userId: session.user.id,
        amount: amount.toString(),
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Payment failed' }, { status: 500 })
  }
}
\`\`\`

---

## Phase 5: File Upload (AWS S3)

### Step 1: S3 Configuration

**File: `lib/s3.ts`**
\`\`\`typescript
import { S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { PutObjectCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function getPresignedUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  })

  return await getSignedUrl(s3Client, command, { expiresIn: 3600 })
}
\`\`\`

---

## 🎯 Implementation Checklist

### ✅ Phase 1: Foundation
- [ ] Environment variables configured
- [ ] Neon database connected
- [ ] Drizzle ORM schema applied
- [ ] Database connection tested

### ⏳ Phase 2: Authentication
- [ ] NextAuth.js configured
- [ ] Login/signup pages created
- [ ] Session management working
- [ ] User registration flow

### ⏳ Phase 3: Core APIs
- [ ] User management APIs
- [ ] Challenge CRUD operations
- [ ] Participant management
- [ ] Real-time updates

### ⏳ Phase 4: Payments
- [ ] Stripe integration
- [ ] Credit purchase flow
- [ ] Webhook handling
- [ ] Transaction tracking

### ⏳ Phase 5: File Storage
- [ ] AWS S3 setup
- [ ] Proof upload system
- [ ] Image processing
- [ ] File validation

---

## 🚨 Quick Start (Right Now!)

1. **Copy the environment template above** to `.env.local`
2. **Sign up for Neon** at console.neon.tech
3. **Get your database URL** and add it to `.env.local`
4. **Run database migrations**:
   \`\`\`bash
   npm run db:generate
   npm run db:migrate
   \`\`\`
5. **Test the connection** by visiting `http://localhost:3000/api/test-db`

## 🎉 Next Steps

Once Phase 1 is complete, you'll have:
- ✅ Real database connected
- ✅ Production-ready schema
- ✅ Type-safe database operations
- ✅ Foundation for all features

Ready to implement? Let's start with Phase 1! 🚀
