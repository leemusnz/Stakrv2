import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'
import { shouldUseDemoData, createDemoResponse } from '@/lib/demo-mode'
import { getDemoBrands } from '@/lib/demo-data'

// GET brands with optional filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const industry = searchParams.get('industry')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    // Check for demo mode (new system) OR demo users (legacy compatibility)
    if (shouldUseDemoData(request, session) || false) {
      const isAdmin = session?.user?.isAdmin || session?.user?.email === 'alex@stakr.app'
      let demoBrands = getDemoBrands(isAdmin)
      
      // Apply industry filter if provided
      if (industry) {
        demoBrands = demoBrands.filter(brand => 
          brand.industry.toLowerCase().includes(industry.toLowerCase())
        )
      }
      
      // Apply category filter if provided
      if (category) {
        demoBrands = demoBrands.filter(brand => 
          brand.categories.some(cat => cat.toLowerCase().includes(category.toLowerCase()))
        )
      }
      
      // Apply limit
      demoBrands = demoBrands.slice(0, limit)

      return NextResponse.json(createDemoResponse({
        success: true,
        brands: demoBrands,
        count: demoBrands.length,
        total_available: getDemoBrands(isAdmin).length,
        filters_applied: { industry, category, limit },
        message: 'Demo brands retrieved successfully'
      }, request, session))
    }

    // Query the database for real brands
    const sql = createDbConnection()
    const offset = parseInt(searchParams.get('offset') || '0')
    
    try {
      // Build query with filters
      let query = `SELECT * FROM brands WHERE 1=1`
      const params: any[] = []
      let paramIndex = 1
      
      // Apply industry filter if provided
      if (industry) {
        query += ` AND industry ILIKE $${paramIndex}`
        params.push(`%${industry}%`)
        paramIndex++
      }
      
      // Apply category filter if provided
      if (category) {
        query += ` AND $${paramIndex}::text = ANY(categories)`
        params.push(category)
        paramIndex++
      }
      
      // Get total count
      let countQuery = `SELECT COUNT(*) as count FROM brands WHERE 1=1`
      const countParams: any[] = []
      let countParamIndex = 1
      
      if (industry) {
        countQuery += ` AND industry ILIKE $${countParamIndex}`
        countParams.push(`%${industry}%`)
        countParamIndex++
      }
      
      if (category) {
        countQuery += ` AND $${countParamIndex}::text = ANY(categories)`
        countParams.push(category)
        countParamIndex++
      }
      
      const countResult = await sql(countQuery, countParams)
      const totalAvailable = parseInt(countResult[0]?.count || '0')
      
      // Apply pagination
      query += ` ORDER BY "followers" DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(limit, offset)
      
      const brands = await sql(query, params)
      
      // If no brands found in DB, return demo data as fallback
      if (brands.length === 0 && totalAvailable === 0) {
        return NextResponse.json({
          success: true,
          brands: getDemoBrands(false),
          count: getDemoBrands(false).length,
          total_available: getDemoBrands(false).length,
          filters_applied: { industry, category, limit, offset },
          message: 'Returning demo brands - database is empty'
        })
      }
      
      return NextResponse.json({
        success: true,
        brands: brands,
        count: brands.length,
        total_available: totalAvailable,
        filters_applied: { industry, category, limit, offset },
        message: 'Brands retrieved successfully'
      })
    } catch (dbError) {
      console.error('Database query error:', dbError)
      // Fall back to demo data on database error
      return NextResponse.json({
        success: true,
        brands: getDemoBrands(false),
        count: getDemoBrands(false).length,
        total_available: getDemoBrands(false).length,
        filters_applied: { industry, category, limit, offset },
        message: 'Returning demo brands - database unavailable'
      })
    }
    
  } catch (error) {
    console.error('Brands fetch error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get brands',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}
