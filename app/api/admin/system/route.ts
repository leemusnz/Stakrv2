import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'
import { isDemoUser } from '@/lib/demo-data'
import { systemLogger } from '@/lib/system-logger'

// Mock system data for demo accounts
const getDemoSystemData = () => ({
  systemHealth: {
    status: 'healthy',
    uptime: 99.8,
    lastRestart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    version: '2.1.4',
    environment: 'development'
  },
  performance: {
    apiResponseTime: 142,
    databaseResponseTime: 35,
    memoryUsage: 45.2,
    cpuUsage: 23.7,
    activeConnections: 234,
    requestsPerMinute: 847
  },
  database: {
    status: 'connected',
    pool: {
      total: 20,
      active: 8,
      idle: 12
    },
    queries: {
      slow: 3,
      failed: 0,
      avgTime: 35
    }
  },
  services: {
    paymentGateway: {
      status: 'online',
      lastCheck: new Date().toISOString(),
      responseTime: 234
    },
    emailService: {
      status: 'online',
      lastCheck: new Date().toISOString(),
      responseTime: 156
    },
    storageService: {
      status: 'online',
      lastCheck: new Date().toISOString(),
      usage: 67,
      totalSpace: 1000 // GB
    }
  },
  logs: [
    {
      id: '1',
      level: 'info',
      message: 'User authentication successful',
      timestamp: new Date(Date.now() - 120000).toISOString(),
      service: 'auth'
    },
    {
      id: '2',
      level: 'warning',
      message: 'Slow query detected: getUserChallenges',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      service: 'database'
    },
    {
      id: '3',
      level: 'info',
      message: 'Challenge verification completed',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      service: 'verification'
    },
    {
      id: '4',
      level: 'error',
      message: 'Payment webhook retry attempt 2/3',
      timestamp: new Date(Date.now() - 900000).toISOString(),
      service: 'payments'
    }
  ],
  devTools: {
    mockDataEnabled: true,
    debugMode: true,
    logLevel: 'debug',
    testingEndpoints: [
      '/api/test-db',
      '/api/test-auth',
      '/api/test-payments',
      '/api/test-notifications'
    ]
  },
  monitoring: {
    alerts: [
      {
        id: 'alert-1',
        type: 'warning',
        message: 'High memory usage detected',
        threshold: 80,
        current: 82.3,
        timestamp: new Date(Date.now() - 1800000).toISOString()
      }
    ],
    metrics: {
      errorRate: 0.12,
      successRate: 99.88,
      averageLatency: 142
    }
  }
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user has admin access
    const sql = await createDbConnection()
    const adminCheck = await sql`
      SELECT has_dev_access FROM users WHERE id = ${session.user.id}
    `
    
    if (!adminCheck[0]?.has_dev_access) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Log admin dashboard access
    systemLogger.info(`Admin dashboard system tab accessed by ${session.user.name || session.user.email}`, 'admin')

    // Always return real system data

    // For real users, get actual system data (reuse existing sql connection)

    // Basic system health
    const systemHealth = {
      status: 'healthy',
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version
    }

    // Performance metrics
    const memoryUsage = process.memoryUsage()
    const performance = {
      memoryUsage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memoryUsage.external / 1024 / 1024) // MB
    }

    // Database health check
    let databaseHealth: any = { status: 'unknown' }
    try {
      const startTime = Date.now()
      await sql`SELECT 1 as test`
      const responseTime = Date.now() - startTime
      
      databaseHealth = {
        status: 'connected',
        responseTime,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      databaseHealth = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }

    const systemData = {
      systemHealth,
      performance,
      database: databaseHealth,
      services: {
        api: {
          status: 'online',
          lastCheck: new Date().toISOString()
        }
      },
      logs: systemLogger.getLogs(50), // Get last 50 real logs
      devTools: {
        debugMode: process.env.NODE_ENV === 'development',
        logLevel: 'info'
      }
    }

    return NextResponse.json({
      success: true,
      system: systemData
    })

  } catch (error) {
    console.error('System monitoring error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch system data',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// POST endpoint for system actions (dev tools)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user has dev access
    const hasDevAccess = session.user.isDev || session.user.email === 'alex@stakr.app'
    if (!hasDevAccess) {
      return NextResponse.json({ error: 'Dev access required' }, { status: 403 })
    }

    const body = await request.json()
    const { action, params } = body

    let result = {}

    switch (action) {
      case 'clear_cache':
        // Mock cache clearing for demo
        result = { message: 'Cache cleared successfully', timestamp: new Date().toISOString() }
        break
        
      case 'test_database':
        try {
          const sql = await createDbConnection()
          const testResult = await sql`SELECT NOW() as current_time, 'database test' as message`
          result = { 
            message: 'Database test successful', 
            data: testResult[0],
            timestamp: new Date().toISOString()
          }
        } catch (error) {
          result = { 
            message: 'Database test failed', 
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          }
        }
        break
        
      case 'toggle_debug':
        // Mock debug toggle for demo
        result = { 
          message: `Debug mode ${params?.enabled ? 'enabled' : 'disabled'}`,
          debugEnabled: params?.enabled || false,
          timestamp: new Date().toISOString()
        }
        break
        
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      action,
      result
    })

  } catch (error) {
    console.error('System action error:', error)
    return NextResponse.json({ 
      error: 'Failed to execute system action',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}
