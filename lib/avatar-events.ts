// Global avatar update event system

type AvatarUpdateListener = (newAvatarUrl: string) => void

class AvatarEventManager {
  private listeners: Set<AvatarUpdateListener> = new Set()
  private lastAvatarUrl: string | null = null

  subscribe(listener: AvatarUpdateListener) {
    this.listeners.add(listener)
    
    // Immediately notify with current avatar if available
    if (this.lastAvatarUrl !== null) {
      try {
        listener(this.lastAvatarUrl)
      } catch (error) {
        console.error('Error in avatar update listener (initial):', error)
      }
    }
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  notify(newAvatarUrl: string) {
    this.lastAvatarUrl = newAvatarUrl
    console.log('🔄 Avatar event system notifying listeners:', newAvatarUrl)
    
    this.listeners.forEach(listener => {
      try {
        listener(newAvatarUrl)
      } catch (error) {
        console.error('Error in avatar update listener:', error)
      }
    })
  }

  // Get the last known avatar URL
  getLastAvatarUrl(): string | null {
    return this.lastAvatarUrl
  }

  // Clear the last avatar URL (useful for logout)
  clear() {
    this.lastAvatarUrl = null
    this.listeners.clear()
  }
}

export const avatarEvents = new AvatarEventManager()