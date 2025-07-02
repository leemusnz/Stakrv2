import { NextRequest, NextResponse } from 'next/server'

// Alpha access password - change this to your desired password
const ALPHA_PASSWORD = process.env.ALPHA_ACCESS_PASSWORD || 'stakr-alpha-2025'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Access code required' 
      }, { status: 400 })
    }

    // Check if password matches
    if (password === ALPHA_PASSWORD) {
      return NextResponse.json({ 
        success: true,
        message: 'Alpha access granted' 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid access code. Please check your code and try again.' 
      }, { status: 401 })
    }

  } catch (error) {
    console.error('Alpha access verification error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Server error. Please try again.' 
    }, { status: 500 })
  }
} 