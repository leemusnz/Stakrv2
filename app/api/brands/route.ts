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

    // For real users, query the database (when implemented)
    const sql = await createDbConnection()
    
    // TODO: Implement real database queries for brands
    // For now, return empty array for real users
    return NextResponse.json({
      success: true,
      brands: [],
      count: 0,
      total_available: 0,
      filters_applied: { industry, category, limit },
      message: 'Brand partnerships feature coming soon!'
    })
    
  } catch (error) {
    console.error('Brands fetch error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get brands',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}
