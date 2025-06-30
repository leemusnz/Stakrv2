import { NextRequest, NextResponse } from 'next/server'
import { createDbConnection } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

// Validation schema for user registration
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  avatar: z.string().optional(),
  confirmPassword: z.string().optional()
}).refine((data) => {
  if (data.confirmPassword && data.password !== data.confirmPassword) {
    return false
  }
  return true
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validationResult = registerSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.issues
      }, { status: 400 })
    }

    const { email, password, name, avatar } = validationResult.data

    // Check if user already exists
    const sql = await createDbConnection()
    
    const existingUsers = await sql`
      SELECT id, email FROM users WHERE email = ${email}
    `
    
    if (existingUsers.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'User already exists',
        message: 'An account with this email address already exists'
      }, { status: 409 })
    }

    // Hash password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Create user in database
    const newUsers = await sql`
      INSERT INTO users (
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
        created_at,
        updated_at
      ) VALUES (
        ${email},
        ${name},
        ${passwordHash},
        ${avatar || null},
        0.00,
        50,
        'manual',
        0,
        0,
        0,
        0,
        false,
        NOW(),
        NOW()
      )
      RETURNING id, email, name, avatar_url, credits, trust_score, verification_tier, created_at
    `

    const newUser = newUsers[0]

    console.log('✅ User created successfully:', newUser.email)

    // Return user data (without password hash)
    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        avatar: newUser.avatar_url,
        credits: parseFloat(newUser.credits),
        trustScore: newUser.trust_score,
        verificationTier: newUser.verification_tier,
        isAdmin: false,
        createdAt: newUser.created_at
      },
      message: 'Account created successfully!'
    }, { status: 201 })

  } catch (error) {
    console.error('❌ User registration failed:', error)
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
        return NextResponse.json({
          success: false,
          error: 'User already exists',
          message: 'An account with this email address already exists'
        }, { status: 409 })
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Registration failed',
      message: 'Unable to create account. Please try again.',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}
