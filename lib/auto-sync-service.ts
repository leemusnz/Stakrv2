/**
 * Automatic Data Synchronization Service
 * Handles syncing data from integrated apps and wearables at critical points
 */

import { createDbConnection } from '@/lib/db'
import { EnhancedAIVerification } from '@/lib/enhanced-ai-verification'

export interface SyncResult {
  success: boolean
  syncedData?: any
  error?: string
  provider?: string
}

export interface ChallengeData {
  id: string
  verificationType?: string
  verificationRequirements?: any
  selectedProofTypes?: string[]
}

/**
 * Critical sync points where automatic data collection should happen
 */
export const SYNC_TRIGGERS = {
  CHALLENGE_JOIN: 'challenge_join',
  DAILY_CHECKIN: 'daily_checkin', 
  CHALLENGE_START: 'challenge_start',
  CHALLENGE_END: 'challenge_end',
  MANUAL_SYNC: 'manual_sync'
} as const

export type SyncTrigger = typeof SYNC_TRIGGERS[keyof typeof SYNC_TRIGGERS]

/**
 * Determines if a challenge uses automatic verification
 */
export function requiresAutoSync(challenge: ChallengeData): boolean {
  if (challenge.verificationType === 'auto') {
    return true
  }
  
  const automaticTypes = ['auto_sync', 'wearable', 'fitness_apps', 'learning_apps']
  
  if (challenge.verificationRequirements?.types) {
    return challenge.verificationRequirements.types.some((type: string) => 
      automaticTypes.includes(type)
    )
  }
  
  if (challenge.selectedProofTypes) {
    return challenge.selectedProofTypes.some(type => automaticTypes.includes(type))
  }
  
  return false
}

/**
 * Gets the user's connected integrations for a challenge
 */
export async function getUserIntegrations(userId: string, challengeTypes: string[]) {
  try {
    const sql = await createDbConnection()
    
    console.log('🔍 Fetching integrations for user:', userId)
    
    // Get wearable integrations
    const wearableIntegrations = await sql`
      SELECT device_type, api_credentials, enabled, last_sync
      FROM wearable_integrations 
      WHERE user_id = ${userId} 
        AND enabled = true
        AND api_credentials IS NOT NULL
    `
    
    console.log('🔍 Wearable integrations query result:', wearableIntegrations)
    
    // Get app integrations  
    const appIntegrations = await sql`
      SELECT app_type, api_credentials, enabled, last_sync
      FROM app_integrations
      WHERE user_id = ${userId}
        AND enabled = true 
        AND api_credentials IS NOT NULL
    `
    
    console.log('🔍 App integrations query result:', appIntegrations)
    
    return {
      wearables: wearableIntegrations,
      apps: appIntegrations
    }
  } catch (error) {
    console.error('Error fetching user integrations:', error)
    return { wearables: [], apps: [] }
  }
}

/**
 * Syncs data from Strava for fitness challenges
 */
export async function syncStravaData(credentials: any, challengeId: string, userId: string): Promise<SyncResult> {
  try {
    console.log('🔍 Strava sync debug:', {
      challengeId,
      userId,
      hasCredentials: !!credentials,
      hasAccessToken: !!credentials?.access_token,
      credentialsKeys: credentials ? Object.keys(credentials) : 'no credentials'
    })
    
    if (!credentials.access_token) {
      console.log('❌ Strava sync failed: No access token available')
      return { success: false, error: 'No access token available', provider: 'strava' }
    }
    
    // Helper to call Strava API with a given access token
    const fetchActivities = async (accessToken: string) => {
      const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000)
      console.log('🌐 Calling Strava API for recent activities...')
      return fetch(`https://www.strava.com/api/v3/athlete/activities?per_page=50&after=${thirtyDaysAgo}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
    }
    
    // First attempt with existing access token
    let response = await fetchActivities(credentials.access_token)
    
    // If unauthorized, attempt token refresh once
    if (response.status === 401 || response.status === 403) {
      try {
        console.log('🔄 Access token expired/invalid. Attempting Strava token refresh...')
        const refreshRes = await fetch('https://www.strava.com/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: process.env.STRAVA_CLIENT_ID,
            client_secret: process.env.STRAVA_CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: credentials.refresh_token
          })
        })
        const refreshData = await refreshRes.json()
        if (!refreshRes.ok) {
          console.error('❌ Strava token refresh failed:', refreshData)
          return { success: false, error: 'Strava token expired and refresh failed', provider: 'strava' }
        }
        // Persist new tokens
        const sqlUpdate = await createDbConnection()
        await sqlUpdate`
          UPDATE wearable_integrations
          SET api_credentials = ${JSON.stringify({
            access_token: refreshData.access_token,
            refresh_token: refreshData.refresh_token || credentials.refresh_token,
            expires_at: refreshData.expires_at,
            athlete: credentials.athlete
          })}, updated_at = NOW(), last_sync = NOW()
          WHERE user_id = ${userId} AND device_type = 'strava'
        `
        // Retry activities with new token
        response = await fetchActivities(refreshData.access_token)
      } catch (refreshError) {
        console.error('❌ Error during Strava token refresh:', refreshError)
        return { success: false, error: 'Failed during Strava token refresh', provider: 'strava' }
      }
    }
    
    if (!response.ok) {
      const msg = `Failed to fetch Strava data (${response.status} ${response.statusText})`
      console.error(`❌ Strava API error: ${response.status} ${response.statusText}`)
      return { success: false, error: msg, provider: 'strava' }
    }
    
    const activities = await response.json()
    console.log(`📡 Strava API response: ${activities.length} activities received`)
    
    // Process and store the activities
    const sql = await createDbConnection()
    
    // Get challenge details for smart filtering
    const challengeDetails = await sql`
      SELECT title, description FROM challenges WHERE id = ${challengeId}
    `
    
    const challengeTitle = challengeDetails[0]?.title || ''
    const challengeDesc = challengeDetails[0]?.description || ''
    
    console.log('🏃 Processing Strava activities for challenge:', challengeTitle)
    console.log(`📊 Total activities retrieved from Strava: ${activities.length}`)
    
    // Debug: Show all activity dates
    activities.forEach((activity, index) => {
      const activityDate = new Date(activity.start_date)
      const daysDiff = Math.floor((new Date().getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24))
      const hoursDiff = Math.floor((new Date().getTime() - activityDate.getTime()) / (1000 * 60 * 60))
      console.log(`📅 Activity ${index + 1}: ${activity.type} - ${activity.start_date} (${daysDiff} days, ${hoursDiff} hours ago)`)
    })
    
    let validActivities = 0
    const challengeText = `${challengeTitle} ${challengeDesc}`.trim()
    
    for (const activity of activities) {
      // Basic filtering: only include recent activities (last 7 days)
      const activityDate = new Date(activity.start_date)
      const today = new Date()
      const daysDiff = Math.floor((today.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff > 30) {
        console.log(`⏰ Skipping old activity: ${activity.type} from ${daysDiff} days ago`)
        continue
      }
      
      console.log(`🕐 Activity found: ${activity.type} from ${daysDiff} days ago (${activity.start_date})`)
      
      console.log(`🤖 AI validating: ${activity.type} for challenge "${challengeTitle}"`)
      
      // Use AI to validate if this activity meets challenge requirements
      try {
        const aiVerification = await EnhancedAIVerification.verify({
          challengeId,
          challengeText: `${challengeText}\n\nCHALLENGE CONTEXT: This is a daily progress challenge where users complete the same activity each day. Today's submission should be evaluated independently for whether it meets the daily requirement.`,
          submissionType: 'auto_sync',
          aiChallengeAnalysis: challenge.aiAnalysis, // Pass AI analysis for enhanced validation
          autoSyncData: {
            provider: 'strava',
            activity: {
              type: activity.type,
              distance: activity.distance,
              duration: activity.moving_time,
              date: activity.start_date,
              calories: activity.calories,
              elevation: activity.total_elevation_gain
            },
            rawData: activity,
            challengeContext: {
              isDaily: true,
              evaluateAsSingleDay: true,
              progressiveChallenge: true
            }
          }
        })
        
        console.log(`🧠 AI decision: ${aiVerification.approved ? '✅ APPROVED' : '❌ REJECTED'} (${aiVerification.confidence}% confidence)`)
        console.log(`💭 AI reasoning: ${aiVerification.reasoning}`)
        
        if (!aiVerification.approved) {
          console.log(`⏭️ Skipping activity: ${aiVerification.reasoning}`)
          continue
        }
        
        if (aiVerification.flags.length > 0) {
          console.log(`⚠️ AI flags: ${aiVerification.flags.join(', ')}`)
        }
      
        // Store as automatic proof submission with AI verification data
        await sql`
          INSERT INTO proof_submissions (
            challenge_id, user_id, submission_type, metadata, status,
            submitted_at, admin_notes, proof_type, proof_content
          ) VALUES (
            ${challengeId}, ${userId}, 'auto_sync', 
            ${JSON.stringify({
              activity_type: activity.type,
              distance: activity.distance,
              duration: activity.moving_time,
              duration_minutes: Math.round(activity.moving_time / 60 * 10) / 10,
              date: activity.start_date,
              strava_id: activity.id,
              source_type: 'strava',
              source_id: activity.id.toString(),
              ai_verification: {
                approved: aiVerification.approved,
                confidence: aiVerification.confidence,
                reasoning: aiVerification.reasoning,
                flags: aiVerification.flags,
                method: aiVerification.metadata.verificationMethod
              }
            })},
            'approved',
            ${activity.start_date},
            ${aiVerification.reasoning},
            'auto_sync',
            ${JSON.stringify({
              activity_summary: `${activity.type}: ${Math.round(activity.distance)}m in ${Math.round(activity.moving_time / 60)}min`,
              strava_activity_id: activity.id,
              source: 'strava_auto_sync'
            })}
          )

        `
        
        validActivities++
        
      } catch (aiError) {
        console.error(`🤖 AI verification failed for activity ${activity.id}:`, aiError)
        
        // Fallback: store with lower confidence if AI fails
        await sql`
          INSERT INTO proof_submissions (
            challenge_id, user_id, submission_type, metadata, status,
            submitted_at, admin_notes, proof_type, proof_content
          ) VALUES (
            ${challengeId}, ${userId}, 'auto_sync', 
            ${JSON.stringify({
              activity_type: activity.type,
              distance: activity.distance,
              duration: activity.moving_time,
              date: activity.start_date,
              strava_id: activity.id,
              source_type: 'strava',
              source_id: activity.id.toString(),
              ai_verification: {
                error: 'AI verification failed',
                fallback_approved: true
              }
            })},
            'pending',
            ${activity.start_date},
            'AI verification failed - requires manual review',
            'auto_sync',
            ${JSON.stringify({
              activity_summary: `${activity.type}: ${Math.round(activity.distance)}m in ${Math.round(activity.moving_time / 60)}min`,
              strava_activity_id: activity.id,
              source: 'strava_auto_sync',
              error: 'ai_verification_failed'
            })}
          )

        `
        
        console.log(`⚠️ Activity stored for manual review due to AI failure`)
        validActivities++
      }
    }
    
    return { 
      success: true, 
      syncedData: { 
        totalActivities: activities.length,
        validActivities,
        aiValidated: validActivities
      }, 
      provider: 'strava' 
    }
  } catch (error) {
    console.error('Strava sync error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      provider: 'strava' 
    }
  }
}

/**
 * Syncs data from Spotify for learning/habit challenges
 */
export async function syncSpotifyData(credentials: any, challengeId: string, userId: string): Promise<SyncResult> {
  try {
    if (!credentials.access_token) {
      return { success: false, error: 'No access token available', provider: 'spotify' }
    }
    
    // Get recently played tracks
    const response = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=50', {
      headers: {
        'Authorization': `Bearer ${credentials.access_token}`
      }
    })
    
    if (!response.ok) {
      return { success: false, error: 'Failed to fetch Spotify data', provider: 'spotify' }
    }
    
    const data = await response.json()
    
    // For podcast/learning challenges, look for educational content
    const educationalTracks = data.items?.filter((item: any) => 
      item.track.type === 'episode' || // Podcast episodes
      item.track.artists?.some((artist: any) => 
        artist.name.toLowerCase().includes('meditation') ||
        artist.name.toLowerCase().includes('audiobook') ||
        artist.name.toLowerCase().includes('podcast')
      )
    ) || []
    
    if (educationalTracks.length > 0) {
      const sql = await createDbConnection()
      
      for (const item of educationalTracks.slice(0, 5)) { // Limit to 5 recent items
        await sql`
          INSERT INTO proof_submissions (
            challenge_id, user_id, submission_type, metadata, status,
            submitted_at, admin_notes, proof_type, proof_content
          ) VALUES (
            ${challengeId}, ${userId}, 'auto_sync',
            ${JSON.stringify({
              track_name: item.track.name,
              artist: item.track.artists?.[0]?.name,
              played_at: item.played_at,
              spotify_id: item.track.id,
              source_type: 'spotify',
              source_id: item.track.id
            })},
            'approved',
            ${item.played_at},
            'Automatically synced from Spotify'
          )

        `
      }
    }
    
    return { 
      success: true, 
      syncedData: { educationalTracks: educationalTracks.length }, 
      provider: 'spotify' 
    }
  } catch (error) {
    console.error('Spotify sync error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      provider: 'spotify' 
    }
  }
}

/**
 * Main sync function that orchestrates all integrations
 */
export async function syncChallengeData(
  challengeId: string, 
  userId: string, 
  trigger: SyncTrigger
): Promise<SyncResult[]> {
  try {
    const sql = await createDbConnection()
    
    // Get challenge verification requirements
    const challenges = await sql`
      SELECT title, description, proof_requirements, verification_type, ai_analysis
      FROM challenges 
      WHERE id = ${challengeId}
    `
    
    if (challenges.length === 0) {
      return [{ success: false, error: 'Challenge not found' }]
    }
    
    const challenge = {
      id: challengeId,
      title: challenges[0].title,
      description: challenges[0].description,
      verificationType: challenges[0].verification_type,
      verificationRequirements: challenges[0].proof_requirements,
      aiAnalysis: challenges[0].ai_analysis ? 
        (typeof challenges[0].ai_analysis === 'string' ? 
          JSON.parse(challenges[0].ai_analysis) : challenges[0].ai_analysis) : null
    }
    
    // Check if this challenge needs auto-sync
    if (!requiresAutoSync(challenge)) {
      return [{ success: true, syncedData: { message: 'No auto-sync required' } }]
    }
    
    // Get user's integrations
    const integrations = await getUserIntegrations(userId, [])
    console.log('🔍 User integrations found:', {
      wearables: integrations.wearables.length,
      apps: integrations.apps.length,
      wearableTypes: integrations.wearables.map(w => w.device_type),
      appTypes: integrations.apps.map(a => a.app_type)
    })
    
    const results: SyncResult[] = []
    
    // Sync from each connected integration
    for (const wearable of integrations.wearables) {
      try {
        const credentials = typeof wearable.api_credentials === 'string' 
          ? JSON.parse(wearable.api_credentials) 
          : wearable.api_credentials
          
        if (wearable.device_type === 'strava') {
          const result = await syncStravaData(credentials, challengeId, userId)
          results.push(result)
        }
        // Add more wearable sync logic here
      } catch (error) {
        results.push({ 
          success: false, 
          error: 'Failed to parse credentials',
          provider: wearable.device_type 
        })
      }
    }
    
    for (const app of integrations.apps) {
      try {
        const credentials = typeof app.api_credentials === 'string'
          ? JSON.parse(app.api_credentials)
          : app.api_credentials
          
        if (app.app_type === 'spotify') {
          const result = await syncSpotifyData(credentials, challengeId, userId)
          results.push(result)
        }
        // Add more app sync logic here
      } catch (error) {
        results.push({ 
          success: false, 
          error: 'Failed to parse credentials',
          provider: app.app_type 
        })
      }
    }
    
    // Update last sync time for all integrations
    if (results.some(r => r.success)) {
      await sql`
        UPDATE wearable_integrations 
        SET last_sync = NOW() 
        WHERE user_id = ${userId} AND enabled = true
      `
      
      await sql`
        UPDATE app_integrations 
        SET last_sync = NOW() 
        WHERE user_id = ${userId} AND enabled = true
      `
    }
    
    return results.length > 0 ? results : [{ success: true, syncedData: { message: 'No integrations to sync' } }]
    
  } catch (error) {
    console.error('Sync challenge data error:', error)
    return [{ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown sync error' 
    }]
  }
}

/**
 * Trigger automatic sync at various points
 */
export async function triggerAutoSync(
  challengeId: string, 
  userId: string, 
  trigger: SyncTrigger
) {
  console.log(`🔄 Auto-sync triggered: ${trigger} for challenge ${challengeId}, user ${userId}`)
  
  const results = await syncChallengeData(challengeId, userId, trigger)
  
  console.log(`✅ Sync completed:`, results)
  
  return results
}
