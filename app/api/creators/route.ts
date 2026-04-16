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
    let limit = parseInt(searchParams.get('limit') || '20')
    
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

    // Query the database for real creators
    const sql = createDbConnection()
    let offset = parseInt(searchParams.get('offset') || '0')
    if (!Number.isFinite(limit) || limit <= 0) limit = 20
    if (!Number.isFinite(offset) || offset < 0) offset = 0
    
    try {
      let countResult
      let creators

      if (category) {
        countResult = await sql`
          SELECT COUNT(*) as count
          FROM creators
          WHERE ${category} = ANY(categories)
        `
        creators = await sql`
          SELECT *
          FROM creators
          WHERE ${category} = ANY(categories)
          ORDER BY followers DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `
      } else {
        countResult = await sql`
          SELECT COUNT(*) as count
          FROM creators
        `
        creators = await sql`
          SELECT *
          FROM creators
          ORDER BY followers DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `
      }

      const totalAvailable = parseInt(countResult[0]?.count || '0')

      // If no creators found in DB, return demo data as fallback
      if (creators.length === 0 && totalAvailable === 0) {
        return NextResponse.json({
          success: true,
          creators: getDemoCreators(false),
          count: getDemoCreators(false).length,
          total_available: getDemoCreators(false).length,
          filters_applied: { category, limit, offset },
          message: 'Returning demo creators - database is empty'
        })
      }
      
      return NextResponse.json({
        success: true,
        creators: creators,
        count: creators.length,
        total_available: totalAvailable,
        filters_applied: { category, limit, offset },
        message: 'Creators retrieved successfully'
      })
    } catch (dbError) {
      console.error('Database query error:', dbError)
      // Fall back to demo data on database error
      return NextResponse.json({
        success: true,
        creators: getDemoCreators(false),
        count: getDemoCreators(false).length,
        total_available: getDemoCreators(false).length,
        filters_applied: { category, limit, offset },
        message: 'Returning demo creators - database unavailable'
      })
    }
    
  } catch (error) {
    console.error('Creators fetch error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get creators',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}
