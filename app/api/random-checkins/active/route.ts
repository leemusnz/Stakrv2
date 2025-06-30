import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET active random check-ins for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Enhanced mock active random check-in with verifiable gestures/words
    const hasActiveCheckin = Math.random() < 0.25 // 25% chance for demo purposes

    if (!hasActiveCheckin) {
      return NextResponse.json({
        success: true,
        checkin: null
      })
    }

    // Enhanced verification types with gestures and words
    const verificationTypes = [
      'photo_gesture',
      'video_gesture', 
      'photo_word',
      'video_word'
    ]
    
    const selectedType = verificationTypes[Math.floor(Math.random() * verificationTypes.length)]
    
    // Pre-defined gestures
    const gestures = [
      { name: 'hold_up_fingers', fingers: Math.floor(Math.random() * 5) + 1, hand: Math.random() > 0.5 ? 'right' : 'left' },
      { name: 'thumbs_up', hand: Math.random() > 0.5 ? 'right' : 'left' },
      { name: 'peace_sign', hand: Math.random() > 0.5 ? 'right' : 'left' },
      { name: 'point_up', hand: Math.random() > 0.5 ? 'right' : 'left' },
      { name: 'wave_hand', hand: Math.random() > 0.5 ? 'right' : 'left' },
      { name: 'touch_nose', hand: Math.random() > 0.5 ? 'right' : 'left' },
      { name: 'ok_sign', hand: Math.random() > 0.5 ? 'right' : 'left' }
    ]
    
    // Pre-defined verification words
    const verificationWords = [
      { word: 'giraffe', pronunciation: 'juh-RAF' },
      { word: 'elephant', pronunciation: 'EL-uh-fuhnt' },
      { word: 'rainbow', pronunciation: 'RAYN-boh' },
      { word: 'thunder', pronunciation: 'THUHN-der' },
      { word: 'crystal', pronunciation: 'KRIS-tuhl' },
      { word: 'butterfly', pronunciation: 'BUHT-er-flahy' },
      { word: 'mountain', pronunciation: 'MOUN-tn' },
      { word: 'ocean', pronunciation: 'OH-shuhn' },
      { word: 'volcano', pronunciation: 'vol-KEY-noh' },
      { word: 'lightning', pronunciation: 'LAHYT-ning' },
      { word: 'adventure', pronunciation: 'ad-VEN-cher' }
    ]

    let mockCheckin: any = {
      id: `checkin-${Date.now()}`,
      session_id: 'demo-session-active',
      challenge_id: 'demo-challenge-1',
      triggered_at: new Date().toISOString(),
      checkin_type: selectedType,
      time_limit_seconds: 60,
      countdown_started: true,
      expires_at: new Date(Date.now() + 60 * 1000).toISOString(),
      verification_difficulty: Math.floor(Math.random() * 3) + 1
    }

    // Generate specific requirements based on type
    if (selectedType.includes('gesture')) {
      const selectedGesture = gestures[Math.floor(Math.random() * gestures.length)]
      
      mockCheckin.required_gesture = selectedGesture.name
      mockCheckin.gesture_details = selectedGesture
      
      if (selectedGesture.name === 'hold_up_fingers') {
        mockCheckin.checkin_prompt = `Take a ${selectedType.includes('video') ? 'video' : 'selfie photo'} holding up ${selectedGesture.fingers} fingers with your ${selectedGesture.hand} hand and keep them clearly visible for 3 seconds`
      } else if (selectedGesture.name === 'thumbs_up') {
        mockCheckin.checkin_prompt = `Take a ${selectedType.includes('video') ? 'video' : 'selfie photo'} showing thumbs up with your ${selectedGesture.hand} hand`
      } else if (selectedGesture.name === 'peace_sign') {
        mockCheckin.checkin_prompt = `Take a ${selectedType.includes('video') ? 'video' : 'selfie photo'} making a peace sign (V fingers) with your ${selectedGesture.hand} hand`
      } else if (selectedGesture.name === 'point_up') {
        mockCheckin.checkin_prompt = `Take a ${selectedType.includes('video') ? 'video' : 'selfie photo'} pointing your ${selectedGesture.hand} index finger upward`
      } else if (selectedGesture.name === 'wave_hand') {
        mockCheckin.checkin_prompt = `Take a ${selectedType.includes('video') ? 'video' : 'selfie photo'} waving your ${selectedGesture.hand} hand at the camera`
      } else if (selectedGesture.name === 'touch_nose') {
        mockCheckin.checkin_prompt = `Take a ${selectedType.includes('video') ? 'video' : 'selfie photo'} touching your nose with your ${selectedGesture.hand} index finger`
      } else if (selectedGesture.name === 'ok_sign') {
        mockCheckin.checkin_prompt = `Take a ${selectedType.includes('video') ? 'video' : 'selfie photo'} making an OK sign (thumb and index finger circle) with your ${selectedGesture.hand} hand`
      }
      
    } else { // word verification
      const selectedWord = verificationWords[Math.floor(Math.random() * verificationWords.length)]
      
      mockCheckin.required_word = selectedWord.word
      mockCheckin.word_pronunciation = selectedWord.pronunciation
      mockCheckin.checkin_prompt = `Take a ${selectedType.includes('video') ? 'video' : 'selfie photo'} while clearly saying the word "${selectedWord.word}" out loud. Pronunciation: ${selectedWord.pronunciation}`
    }

    return NextResponse.json({
      success: true,
      checkin: mockCheckin,
      message: 'Random verification triggered! Complete the specific gesture or word requirement quickly.'
    })

  } catch (error) {
    console.error('Get active checkins error:', error)
    return NextResponse.json({
      error: 'Failed to get active checkins',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}
