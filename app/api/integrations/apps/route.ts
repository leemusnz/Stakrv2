import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { appIntegrationManager, IntegratedApp, AppIntegrationConfig } from '@/lib/app-integrations'
import { createDbConnection } from '@/lib/db'
import { encryptCredentials, decryptCredentials } from '@/lib/encryption'

// GET - List user's app integrations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sql = createDbConnection()
    
    // Get user's app integrations from database
    const integrations = await sql`
      SELECT 
        app_type,
        enabled,
        last_sync,
        auto_sync,
        privacy_level,
        created_at,
        updated_at
      FROM app_integrations 
      WHERE user_id = ${session.user.id}
      ORDER BY created_at DESC
    `

    // Get available apps from manager
    const availableApps = appIntegrationManager.getAvailableApps()

    return NextResponse.json({
      success: true,
      integrations: integrations.map((integration: Record<string, any>) => ({
        app: integration.app_type,
        enabled: integration.enabled,
        lastSync: integration.last_sync,
        autoSync: integration.auto_sync,
        privacyLevel: integration.privacy_level,
        connected: availableApps.includes(integration.app_type),
        createdAt: integration.created_at,
        updatedAt: integration.updated_at
      })),
      availableApps: [
        'myfitnesspal',
        'headspace',
        'duolingo',
        'noom',
        'coursera',
        'khan_academy',
        'spotify',
        'youtube_music',
        'goodreads',
        'todoist',
        'notion',
        'github',
        'linkedin_learning'
      ]
    })

  } catch (error) {
    console.error('Failed to fetch app integrations:', error)
    return NextResponse.json({
      error: 'Failed to fetch integrations',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// POST - Add or update app integration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      app,
      enabled = true,
      autoSync = true,
      privacyLevel = 'standard',
      apiKey,
      accessToken,
      refreshToken,
      username,
      dataTypes = []
    } = await request.json()

    if (!app) {
      return NextResponse.json({ error: 'App type is required' }, { status: 400 })
    }

    const config: AppIntegrationConfig = {
      app: app as IntegratedApp,
      enabled,
      apiKey,
      accessToken,
      refreshToken,
      username,
      autoSync,
      dataTypes: dataTypes.length > 0 ? dataTypes : getDefaultDataTypes(app),
      privacyLevel: privacyLevel as 'minimal' | 'standard' | 'detailed'
    }

    // Add integration to manager
    const connected = await appIntegrationManager.addIntegration(app, config)
    
    if (!connected) {
      return NextResponse.json({ 
        error: 'Failed to connect to app',
        app 
      }, { status: 400 })
    }

    const sql = createDbConnection()

    // Save integration to database with encrypted credentials
    await sql`
      INSERT INTO app_integrations (
        user_id,
        app_type,
        enabled,
        auto_sync,
        privacy_level,
        api_credentials,
        data_types,
        created_at,
        updated_at
      ) VALUES (
        ${session.user.id},
        ${app},
        ${enabled},
        ${autoSync},
        ${privacyLevel},
        ${encryptCredentials({
          apiKey,
          username,
          accessToken,
          refreshToken,
          expiresAt: accessToken ? Math.floor(Date.now() / 1000) + 3600 : null // Default 1hr expiry
        })},
        ${JSON.stringify(dataTypes)},
        NOW(),
        NOW()
      )
      ON CONFLICT (user_id, app_type) 
      DO UPDATE SET
        enabled = EXCLUDED.enabled,
        auto_sync = EXCLUDED.auto_sync,
        privacy_level = EXCLUDED.privacy_level,
        api_credentials = EXCLUDED.api_credentials,
        data_types = EXCLUDED.data_types,
        updated_at = NOW()
    `


    return NextResponse.json({
      success: true,
      message: `${app} integration ${connected ? 'connected' : 'added'} successfully`,
      integration: {
        app,
        enabled,
        connected,
        autoSync,
        privacyLevel,
        dataTypes
      }
    })

  } catch (error) {
    console.error('Failed to add app integration:', error)
    return NextResponse.json({
      error: 'Failed to add integration',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// Helper function to get default data types for an app
function getDefaultDataTypes(app: string): string[] {
  const defaults: Record<string, string[]> = {
    myfitnesspal: ['nutrition_log'],
    headspace: ['meditation_session'],
    duolingo: ['language_lesson', 'learning_streak'],
    github: ['code_commit'],
    coursera: ['course_completion'],
    todoist: ['task_completion'],
    goodreads: ['reading_progress']
  }
  
  return defaults[app] || []
}

// DELETE - Remove app integration
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const app = searchParams.get('app')

    if (!app) {
      return NextResponse.json({ error: 'App parameter is required' }, { status: 400 })
    }

    const sql = createDbConnection()

    // Remove from database
    const result = await sql`
      DELETE FROM app_integrations 
      WHERE user_id = ${session.user.id} 
      AND app_type = ${app}
    `

    if (result.count === 0) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }


    return NextResponse.json({
      success: true,
      message: `${app} integration removed successfully`
    })

  } catch (error) {
    console.error('Failed to remove app integration:', error)
    return NextResponse.json({
      error: 'Failed to remove integration',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}
