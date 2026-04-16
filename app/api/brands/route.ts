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
    let limit = parseInt(searchParams.get('limit') || '20')
    
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
    let offset = parseInt(searchParams.get('offset') || '0')
    if (!Number.isFinite(limit) || limit <= 0) limit = 20
    if (!Number.isFinite(offset) || offset < 0) offset = 0
    
    try {
      const industryPattern = industry ? `%${industry}%` : null
      let countResult
      let brands

      if (industryPattern && category) {
        countResult = await sql`
          SELECT COUNT(*) as count
          FROM brands
          WHERE industry ILIKE ${industryPattern}
          AND ${category} = ANY(categories)
        `
        brands = await sql`
          SELECT *
          FROM brands
          WHERE industry ILIKE ${industryPattern}
          AND ${category} = ANY(categories)
          ORDER BY followers DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `
      } else if (industryPattern) {
        countResult = await sql`
          SELECT COUNT(*) as count
          FROM brands
          WHERE industry ILIKE ${industryPattern}
        `
        brands = await sql`
          SELECT *
          FROM brands
          WHERE industry ILIKE ${industryPattern}
          ORDER BY followers DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `
      } else if (category) {
        countResult = await sql`
          SELECT COUNT(*) as count
          FROM brands
          WHERE ${category} = ANY(categories)
        `
        brands = await sql`
          SELECT *
          FROM brands
          WHERE ${category} = ANY(categories)
          ORDER BY followers DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `
      } else {
        countResult = await sql`
          SELECT COUNT(*) as count
          FROM brands
        `
        brands = await sql`
          SELECT *
          FROM brands
          ORDER BY followers DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `
      }

      const totalAvailable = parseInt(countResult[0]?.count || '0')

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
