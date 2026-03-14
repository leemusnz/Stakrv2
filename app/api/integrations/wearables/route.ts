import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { wearableManager, WearableDevice, WearableIntegrationConfig } from '@/lib/wearable-integrations'
import { createDbConnection } from '@/lib/db'
import { encryptCredentials, decryptCredentials } from '@/lib/encryption'

// GET - List user's wearable integrations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sql = await createDbConnection()
    
    // Get user's wearable integrations from database
    const integrations = await sql`
      SELECT 
        device_type,
        enabled,
        last_sync,
        auto_sync,
        privacy_level,
        api_credentials,
        created_at,
        updated_at
      FROM wearable_integrations 
      WHERE user_id = ${session.user.id}
      ORDER BY created_at DESC
    `

    // Get available devices from manager
    const availableDevices = wearableManager.getAvailableDevices()

    return NextResponse.json({
      success: true,
      integrations: integrations.map((integration: Record<string, any>) => {
        // Check if integration has valid credentials
        let connected = false
        try {
          if (integration.api_credentials) {
            const credentials = decryptCredentials(integration.api_credentials)
            
            // For OAuth integrations, check for access_token
            connected = !!(credentials.access_token || credentials.accessToken || credentials.apiKey)
          }
        } catch (error) {
          console.error('Error decrypting credentials for', integration.device_type, error)
          connected = false
        }

        return {
          device: integration.device_type,
          enabled: integration.enabled,
          lastSync: integration.last_sync,
          autoSync: integration.auto_sync,
          privacyLevel: integration.privacy_level,
          connected,
          createdAt: integration.created_at,
          updatedAt: integration.updated_at
        }
      }),
      availableDevices: [
        'apple_watch',
        'fitbit', 
        'garmin',
        'samsung_galaxy_watch',
        'google_fit',
        'strava',
        'polar',
        'withings',
        'oura_ring',
        'whoop'
      ]
    })

  } catch (error) {
    console.error('Failed to fetch wearable integrations:', error)
    return NextResponse.json({
      error: 'Failed to fetch integrations',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// POST - Add or update wearable integration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      device,
      enabled = true,
      autoSync = true,
      privacyLevel = 'standard',
      apiKey,
      clientId,
      clientSecret,
      accessToken,
      refreshToken
    } = await request.json()

    if (!device) {
      return NextResponse.json({ error: 'Device type is required' }, { status: 400 })
    }

    const config: WearableIntegrationConfig = {
      device: device as WearableDevice,
      enabled,
      apiKey,
      clientId,
      clientSecret,
      accessToken,
      refreshToken,
      autoSync,
      dataTypes: ['steps', 'heart_rate', 'workout', 'calories'], // Default data types
      privacyLevel: privacyLevel as 'minimal' | 'standard' | 'detailed'
    }

    // Add integration to manager
    const connected = await wearableManager.addIntegration(device, config)
    
    if (!connected) {
      return NextResponse.json({ 
        error: 'Failed to connect to device',
        device 
      }, { status: 400 })
    }

    const sql = await createDbConnection()

    // Save integration to database with encrypted credentials
    await sql`
      INSERT INTO wearable_integrations (
        user_id,
        device_type,
        enabled,
        auto_sync,
        privacy_level,
        api_credentials,
        created_at,
        updated_at
      ) VALUES (
        ${session.user.id},
        ${device},
        ${enabled},
        ${autoSync},
        ${privacyLevel},
        ${encryptCredentials({
          apiKey,
          clientId,
          clientSecret,
          accessToken,
          refreshToken,
          expiresAt: accessToken ? Math.floor(Date.now() / 1000) + 3600 : null // Default 1hr expiry
        })},
        NOW(),
        NOW()
      )
      ON CONFLICT (user_id, device_type) 
      DO UPDATE SET
        enabled = EXCLUDED.enabled,
        auto_sync = EXCLUDED.auto_sync,
        privacy_level = EXCLUDED.privacy_level,
        api_credentials = EXCLUDED.api_credentials,
        updated_at = NOW()
    `

    console.log(`✅ Wearable integration added: ${device} for user ${session.user.id}`)

    return NextResponse.json({
      success: true,
      message: `${device} integration ${connected ? 'connected' : 'added'} successfully`,
      integration: {
        device,
        enabled,
        connected,
        autoSync,
        privacyLevel
      }
    })

  } catch (error) {
    console.error('Failed to add wearable integration:', error)
    return NextResponse.json({
      error: 'Failed to add integration',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// DELETE - Remove wearable integration
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const device = searchParams.get('device')

    if (!device) {
      return NextResponse.json({ error: 'Device parameter is required' }, { status: 400 })
    }

    const sql = await createDbConnection()

    // Remove from database
    const result = await sql`
      DELETE FROM wearable_integrations 
      WHERE user_id = ${session.user.id} 
      AND device_type = ${device}
    `

    if (result.count === 0) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    console.log(`🗑️ Wearable integration removed: ${device} for user ${session.user.id}`)

    return NextResponse.json({
      success: true,
      message: `${device} integration removed successfully`
    })

  } catch (error) {
    console.error('Failed to remove wearable integration:', error)
    return NextResponse.json({
      error: 'Failed to remove integration',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}
