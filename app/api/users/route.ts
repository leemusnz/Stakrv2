import { NextRequest, NextResponse } from 'next/server'

// GET all users or specific user by email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    // For now, return mock data that matches our database schema
    // This will be replaced with real database queries once imports are fixed
    
    if (email) {
      // Return specific user
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: email,
        name: 'Test User',
        avatar_url: null,
        credits: 100.00,
        trust_score: 75,
        verification_tier: 'manual',
        challenges_completed: 3,
        false_claims: 0,
        current_streak: 5,
        longest_streak: 12,
        premium_subscription: false,
        premium_expires_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      return NextResponse.json({
        success: true,
        user,
        message: `User found: ${email}`
      })
    } else {
      // Return all users (limited for demo)
      const users = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'alice@stakr.app',
          name: 'Alice Johnson',
          avatar_url: null,
          credits: 150.00,
          trust_score: 85,
          verification_tier: 'auto',
          challenges_completed: 12,
          false_claims: 0,
          current_streak: 8,
          longest_streak: 15,
          premium_subscription: true,
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          email: 'bob@stakr.app',
          name: 'Bob Smith',
          avatar_url: null,
          credits: 75.50,
          trust_score: 72,
          verification_tier: 'manual',
          challenges_completed: 7,
          false_claims: 1,
          current_streak: 3,
          longest_streak: 9,
          premium_subscription: false,
          created_at: '2024-02-20T14:30:00Z'
        }
      ]
      
      return NextResponse.json({
        success: true,
        users,
        count: users.length,
        message: 'Users retrieved successfully'
      })
    }
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// CREATE new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, avatar_url } = body
    
    if (!email || !name) {
      return NextResponse.json({
        success: false,
        error: 'Email and name are required'
      }, { status: 400 })
    }
    
    // For now, create mock user data
    // This will be replaced with real database insert
    const newUser = {
      id: crypto.randomUUID(),
      email,
      name,
      avatar_url: avatar_url || null,
      credits: 0.00,
      trust_score: 50,
      verification_tier: 'manual',
      challenges_completed: 0,
      false_claims: 0,
      current_streak: 0,
      longest_streak: 0,
      premium_subscription: false,
      premium_expires_at: null,
      email_verified: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    return NextResponse.json({
      success: true,
      user: newUser,
      message: 'User created successfully',
      note: 'This is mock data. Will be replaced with real database insert.'
    }, { status: 201 })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to create user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 