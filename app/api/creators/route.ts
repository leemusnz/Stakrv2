import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'
import { shouldUseDemoData, createDemoResponse } from '@/lib/demo-mode'
import { getDemoCreators } from '@/lib/demo-data'

// GET creators with optional filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    // Check for demo mode (new system) OR demo users (legacy compatibility)
    if (shouldUseDemoData(request, session) || false) {
      const isAdmin = session?.user?.isAdmin || session?.user?.email === 'alex@stakr.app'
      let demoCreators = getDemoCreators(isAdmin)
      
      // Apply category filter if provided
      if (category) {
        demoCreators = demoCreators.filter(creator => 
          creator.categories.some(cat => cat.toLowerCase().includes(category.toLowerCase()))
        )
      }
      
      // Apply limit
      demoCreators = demoCreators.slice(0, limit)

      return NextResponse.json(createDemoResponse({
        success: true,
        creators: demoCreators,
        count: demoCreators.length,
        total_available: getDemoCreators(isAdmin).length,
        filters_applied: { category, limit },
        message: 'Demo creators retrieved successfully'
      }, request, session))
    }

    // For real users, query the database (when implemented)
    const sql = await createDbConnection()
    
    // TODO: Implement real database queries for creators
    // For now, return empty array for real users
    return NextResponse.json({
      success: true,
      creators: [],
      count: 0,
      total_available: 0,
      filters_applied: { category, limit },
      message: 'Creators feature coming soon!'
    })
    
  } catch (error) {
    console.error('Creators fetch error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get creators',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}
