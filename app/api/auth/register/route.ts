import { NextRequest, NextResponse } from 'next/server'
import { createDbConnection } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { sendEmail, createVerificationEmail, generateVerificationToken } from '@/lib/email'

// Validation schema for user registration
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  avatar: z.string().optional(),
  confirmPassword: z.string().optional(),
  onboardingData: z.object({
    goals: z.array(z.string()).optional(),
    interests: z.array(z.string()).optional(),
    experience: z.string().optional(),
    motivation: z.string().optional(),
    preferredStakeRange: z.string().optional()
  }).optional()
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

    const { email, password, name, username: providedUsername, avatar, onboardingData } = validationResult.data
    
    // Log onboarding data for analytics
    if (onboardingData) {
      console.log('📊 Onboarding data received:', {
        goals: onboardingData.goals?.length || 0,
        hasExperience: !!onboardingData.experience,
        hasMotivation: !!onboardingData.motivation,
        hasStakeRange: !!onboardingData.preferredStakeRange
      })
    }

    // Generate username if not provided
    let username = providedUsername
    if (!username) {
      // Generate username from email (part before @)
      const emailPrefix = email.split('@')[0].toLowerCase()
      username = emailPrefix.replace(/[^a-z0-9]/g, '')
      
      // Ensure minimum length
      if (username.length < 3) {
        username = emailPrefix.slice(0, 3) + Math.random().toString(36).slice(2, 5)
      }
    }

    // Check if user already exists
    const sql = await createDbConnection()
    
    const existingUsers = await sql`
      SELECT id, email, username FROM users 
      WHERE email = ${email} OR username = ${username}
    `
    
    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0]
      if (existingUser.email === email) {
        return NextResponse.json({
          success: false,
          error: 'User already exists',
          message: 'An account with this email address already exists'
        }, { status: 409 })
      } else {
        // Username conflict - generate a unique one
        const randomSuffix = Math.random().toString(36).slice(2, 6)
        username = `${username}${randomSuffix}`
      }
    }

    // Hash password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)
    
    console.log(`🔧 Creating user: email=${email}, username=${username}, name=${name}`)

    // Create user in database
    let newUsers
    try {
      newUsers = await sql`
        INSERT INTO users (
          email, 
          name,
          username,
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
          email_verified,
          email_verified_at,
          onboarding_completed,
          created_at,
          updated_at
        ) VALUES (
          ${email},
          ${name},
          ${username},
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
          false,
          NULL,
          false,
          NOW(),
          NOW()
        )
        RETURNING id, email, name, username, avatar_url, credits, trust_score, verification_tier, email_verified, email_verified_at, created_at
      `
    } catch (dbError) {
      console.error('❌ Database insertion failed:', dbError)
      throw new Error(`Database error: ${dbError instanceof Error ? dbError.message : 'Unknown database error'}`)
    }

    const newUser = newUsers[0]

    console.log('✅ User created successfully:', newUser.email, 'with username:', newUser.username)

    // Generate verification token and send email
    const verificationToken = generateVerificationToken()
    let emailSent = false
    
    try {
      // Store verification token in database
      await sql`
        SELECT create_verification_token(${email}, ${verificationToken}, 'email_verification', 24)
      `

      // Send verification email
      const emailTemplate = createVerificationEmail(email, verificationToken, name)
      const emailResult = await sendEmail(emailTemplate)

      if (!emailResult.success) {
        console.error('❌ Failed to send verification email:', emailResult.error)
        // Note: We don't fail registration if email fails to send
      } else {
        console.log('✅ Verification email sent to:', email)
        emailSent = true
      }
    } catch (emailError) {
      console.error('❌ Email verification setup failed:', emailError)
      // Continue with registration even if email fails
    }

    // Return user data (without password hash)
    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        username: newUser.username,
        avatar: newUser.avatar_url,
        credits: parseFloat(newUser.credits),
        trustScore: newUser.trust_score,
        verificationTier: newUser.verification_tier,
        emailVerified: newUser.email_verified,
        isAdmin: false,
        createdAt: newUser.created_at
      },
      message: emailSent 
        ? 'Account created successfully! Please check your email to verify your account before signing in.' 
        : 'Account created successfully! Email verification is temporarily unavailable, but you can sign in.',
      emailSent
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
