'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Camera, Clock, Zap, Type, MapPin, AlertTriangle, Hand, Volume2, Video } from 'lucide-react'
import { toast } from 'sonner'

interface RandomCheckinModalProps {
  checkin: {
    id: string
    checkin_type: string
    checkin_prompt: string
    time_limit_seconds: number
    triggered_at: string
    expires_at: string
    required_gesture?: string
    gesture_details?: any
    required_word?: string
    word_pronunciation?: string
    verification_difficulty?: number
  }
  onResponse: (response: { type: string; data: any }) => void
  onClose: () => void
}

export function RandomCheckinModal({
  checkin,
  onResponse,
  onClose
}: RandomCheckinModalProps) {
  const [timeRemaining, setTimeRemaining] = useState(checkin.time_limit_seconds)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [textResponse, setTextResponse] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          toast.error('Time expired! Check-in failed.')
          onResponse({ type: 'expired', data: null })
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [onResponse])

  const handlePhotoCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File too large. Please choose a smaller image.')
        return
      }
      
      setPhotoFile(file)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const submitPhotoResponse = async () => {
    if (!photoFile && !photoPreview) {
      toast.error('Please take or upload a photo first')
      return
    }

    setIsSubmitting(true)
    
    try {
      const responseData = {
        photo_data: photoPreview,
        file_name: photoFile?.name || 'camera_capture.jpg',
        file_size: photoFile?.size || 0,
        timestamp: new Date().toISOString(),
        gesture_attempted: checkin.required_gesture,
        gesture_details: checkin.gesture_details,
        word_attempted: checkin.required_word
      }
      
      onResponse({
        type: checkin.checkin_type.includes('video') ? 'video' : 'photo',
        data: responseData
      })
    } catch (error) {
      console.error('Submit photo error:', error)
      toast.error('Failed to submit photo')
      setIsSubmitting(false)
    }
  }

  const submitTextResponse = () => {
    if (!textResponse.trim()) {
      toast.error('Please provide a text response')
      return
    }

    setIsSubmitting(true)
    
    onResponse({
      type: 'text',
      data: {
        text: textResponse.trim(),
        timestamp: new Date().toISOString()
      }
    })
  }

  const submitLocationResponse = () => {
    setIsSubmitting(true)
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onResponse({
            type: 'location',
            data: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date().toISOString()
            }
          })
        },
        (error) => {
          console.error('Geolocation error:', error)
          toast.error('Unable to get location. Check-in failed.')
          onResponse({ type: 'location_failed', data: { error: error.message } })
        }
      )
    } else {
      toast.error('Geolocation not supported')
      onResponse({ type: 'location_failed', data: { error: 'Geolocation not supported' } })
    }
  }

  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`
  }

  const progressPercentage = (timeRemaining / checkin.time_limit_seconds) * 100
  const isUrgent = timeRemaining <= 20

  // Get gesture icon and description
  const getGestureInfo = () => {
    if (!checkin.required_gesture) return null
    
    const gestureDescriptions: { [key: string]: { icon: any, description: string } } = {
      'hold_up_fingers': { 
        icon: Hand, 
        description: `Hold up ${checkin.gesture_details?.fingers || 'some'} fingers with your ${checkin.gesture_details?.hand || 'right'} hand` 
      },
      'thumbs_up': { 
        icon: Hand, 
        description: `Show thumbs up with your ${checkin.gesture_details?.hand || 'right'} hand` 
      },
      'peace_sign': { 
        icon: Hand, 
        description: `Make a peace sign (V) with your ${checkin.gesture_details?.hand || 'right'} hand` 
      },
      'point_up': { 
        icon: Hand, 
        description: `Point your ${checkin.gesture_details?.hand || 'right'} index finger upward` 
      },
      'wave_hand': { 
        icon: Hand, 
        description: `Wave your ${checkin.gesture_details?.hand || 'right'} hand at the camera` 
      },
      'touch_nose': { 
        icon: Hand, 
        description: `Touch your nose with your ${checkin.gesture_details?.hand || 'right'} index finger` 
      },
      'ok_sign': { 
        icon: Hand, 
        description: `Make an OK sign (circle) with your ${checkin.gesture_details?.hand || 'right'} hand` 
      }
    }
    
    return gestureDescriptions[checkin.required_gesture] || { icon: Hand, description: 'Perform the required gesture' }
  }

  const gestureInfo = getGestureInfo()
  const isGestureVerification = checkin.checkin_type.includes('gesture')
  const isWordVerification = checkin.checkin_type.includes('word')
  const isVideoRequired = checkin.checkin_type.includes('video')

  return (
    <Dialog open={true} onOpenChange={onClose}>
              <DialogContent className="sm:max-w-md mobile-safe-width" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Random Verification Check-in
            <Badge variant={isUrgent ? "destructive" : "secondary"}>
              <Clock className="h-3 w-3 mr-1" />
              {formatTime(timeRemaining)}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Complete this specific verification to continue your activity session
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Progress 
              value={progressPercentage} 
              className={`w-full ${isUrgent ? 'bg-red-100' : ''}`}
            />
            {isUrgent && (
              <div className="flex items-center gap-1 text-red-600 text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>Time running out!</span>
              </div>
            )}
          </div>

          {/* Enhanced Verification Requirements */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-3">
              {isGestureVerification && gestureInfo && <gestureInfo.icon className="h-5 w-5 text-blue-600" />}
              {isWordVerification && <Volume2 className="h-5 w-5 text-blue-600" />}
              {isVideoRequired && <Video className="h-4 w-4 text-blue-600" />}
              <h3 className="font-medium text-blue-900 dark:text-blue-100">
                {isGestureVerification ? 'Gesture Verification Required' : 
                 isWordVerification ? 'Word Verification Required' : 
                 'Verification Required'}
              </h3>
            </div>
            
            <p className="text-blue-800 dark:text-blue-200 mb-3">
              {checkin.checkin_prompt}
            </p>

            {/* Gesture Instructions */}
            {isGestureVerification && gestureInfo && (
              <div className="mt-3 p-3 bg-blue-100 dark:bg-blue-900 rounded border border-blue-300 dark:border-blue-700">
                <div className="flex items-center gap-2 mb-2">
                  <Hand className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                  <span className="font-medium text-blue-700 dark:text-blue-300">Gesture Guide:</span>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {gestureInfo.description}
                </p>
                {checkin.gesture_details?.duration_seconds && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Hold for {checkin.gesture_details.duration_seconds} seconds
                  </p>
                )}
              </div>
            )}

            {/* Word Instructions */}
            {isWordVerification && checkin.required_word && (
              <div className="mt-3 p-3 bg-green-100 dark:bg-green-900 rounded border border-green-300 dark:border-green-700">
                <div className="flex items-center gap-2 mb-2">
                  <Volume2 className="h-4 w-4 text-green-700 dark:text-green-300" />
                  <span className="font-medium text-green-700 dark:text-green-300">Say This Word:</span>
                </div>
                <div className="text-lg font-bold text-green-800 dark:text-green-200 mb-1">
                  "{checkin.required_word}"
                </div>
                {checkin.word_pronunciation && (
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Pronunciation: {checkin.word_pronunciation}
                  </p>
                )}
              </div>
            )}

            {/* Difficulty Indicator */}
            {checkin.verification_difficulty && checkin.verification_difficulty > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-blue-600 dark:text-blue-400">Difficulty:</span>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <div 
                      key={i} 
                      className={`w-2 h-2 rounded-full ${
                        i < checkin.verification_difficulty! 
                          ? 'bg-yellow-500' 
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`} 
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Response Interface */}
          {(checkin.checkin_type.includes('photo') || checkin.checkin_type.includes('video')) && (
            <div className="space-y-4">
              {photoPreview ? (
                <div className="space-y-2">
                  {isVideoRequired ? (
                    <video 
                      src={photoPreview} 
                      controls 
                      className="w-full h-48 rounded-lg border"
                    />
                  ) : (
                    <img 
                      src={photoPreview} 
                      alt="Verification photo" 
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPhotoFile(null)
                        setPhotoPreview(null)
                      }}
                    >
                      Retake
                    </Button>
                    <Button
                      size="sm"
                      onClick={submitPhotoResponse}
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Verification'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handlePhotoCapture}
                    className="w-full"
                    size="lg"
                  >
                    {isVideoRequired ? (
                      <>
                        <Video className="h-4 w-4 mr-2" />
                        Record Video
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4 mr-2" />
                        Take Photo
                      </>
                    )}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={isVideoRequired ? "video/*" : "image/*"}
                    capture={isVideoRequired ? "user" : "environment"}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    {isGestureVerification && 'Make sure the gesture is clearly visible'}
                    {isWordVerification && 'Speak clearly while recording'}
                  </p>
                </div>
              )}
            </div>
          )}

          {checkin.checkin_type === 'text_response' && (
            <div className="space-y-4">
              <Textarea
                placeholder="Enter your response here..."
                value={textResponse}
                onChange={(e) => setTextResponse(e.target.value)}
                rows={3}
              />
              <Button
                onClick={submitTextResponse}
                disabled={isSubmitting || !textResponse.trim()}
                className="w-full"
                size="lg"
              >
                <Type className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Submitting...' : 'Submit Response'}
              </Button>
            </div>
          )}

          {checkin.checkin_type === 'location_verify' && (
            <div className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                We'll verify your current location to ensure you're actively participating
              </div>
              <Button
                onClick={submitLocationResponse}
                disabled={isSubmitting}
                className="w-full"
                size="lg"
              >
                <MapPin className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Getting Location...' : 'Share Location'}
              </Button>
            </div>
          )}

          {timeRemaining < checkin.time_limit_seconds / 2 && (
            <div className="pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onResponse({ type: 'skipped', data: { reason: 'unable_to_complete' } })
                }}
                className="w-full text-muted-foreground"
              >
                Can't complete this verification
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-1">
                This will significantly impact your session quality score
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
