import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Alpha access password - change this to your desired password
const ALPHA_PASSWORD = process.env.ALPHA_ACCESS_PASSWORD || 'sixfishiesfarting'

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Alpha access API called')
    const { password } = await request.json()
    console.log('🔐 Password received:', password ? '[REDACTED]' : 'NO PASSWORD')

    if (!password) {
      console.log('❌ No password provided')
      return NextResponse.json({ 
        success: false, 
        error: 'Access code required' 
      }, { status: 400 })
    }

    // Check if password matches
    const expectedPassword = ALPHA_PASSWORD
    console.log('🔐 Expected password:', expectedPassword ? '[REDACTED]' : 'NO EXPECTED PASSWORD')
    console.log('🔐 Password match:', password === expectedPassword)
    
    if (password === ALPHA_PASSWORD) {
      console.log('✅ Password correct, creating success response')
      
      // Create response with success
      const response = NextResponse.json({ 
        success: true,
        message: 'Alpha access granted' 
      })

      console.log('🍪 Setting alpha_access cookie...')
      // Set the cookie server-side (this ensures it's set before redirect)
      response.cookies.set('alpha_access', 'true', {
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        httpOnly: false // Allow client-side access for debugging
      })

      console.log('✅ Cookie set, returning success response')
      return response
    } else {
      console.log('❌ Password incorrect')
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid access code. Please check your code and try again.' 
      }, { status: 401 })
    }

  } catch (error) {
    console.error('💥 Alpha access verification error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Server error. Please try again.' 
    }, { status: 500 })
  }
}
