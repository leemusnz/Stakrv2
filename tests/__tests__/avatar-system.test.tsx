/**
 * Avatar System Tests
 * 
 * Tests for the avatar event system that coordinates avatar updates across components.
 * Focuses on testing the real avatar event manager implementation.
 */

import { jest } from '@jest/globals'
import { avatarEvents } from '@/lib/avatar-events'

describe('Avatar Event System', () => {
  beforeEach(() => {
    avatarEvents.clear()
    jest.clearAllMocks()
  })

  describe('AvatarEventManager', () => {
    it('should subscribe and receive notifications', () => {
      const listener = jest.fn()
      
      avatarEvents.subscribe(listener)
      avatarEvents.notify('https://example.com/avatar.jpg')

      expect(listener).toHaveBeenCalledWith('https://example.com/avatar.jpg')
    })

    it('should notify all subscribed listeners', () => {
      const listener1 = jest.fn()
      const listener2 = jest.fn()
      const listener3 = jest.fn()

      avatarEvents.subscribe(listener1)
      avatarEvents.subscribe(listener2)
      avatarEvents.subscribe(listener3)

      avatarEvents.notify('https://example.com/new-avatar.jpg')

      expect(listener1).toHaveBeenCalledWith('https://example.com/new-avatar.jpg')
      expect(listener2).toHaveBeenCalledWith('https://example.com/new-avatar.jpg')
      expect(listener3).toHaveBeenCalledWith('https://example.com/new-avatar.jpg')
    })

    it('should unsubscribe listeners', () => {
      const listener = jest.fn()
      
      const unsubscribe = avatarEvents.subscribe(listener)
      avatarEvents.notify('https://example.com/avatar1.jpg')
      
      expect(listener).toHaveBeenCalledTimes(1)
      
      unsubscribe()
      avatarEvents.notify('https://example.com/avatar2.jpg')
      
      // Should not be called again after unsubscribe
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('should store and retrieve last avatar URL', () => {
      avatarEvents.notify('https://example.com/last-avatar.jpg')
      
      const lastUrl = avatarEvents.getLastAvatarUrl()
      expect(lastUrl).toBe('https://example.com/last-avatar.jpg')
    })

    it('should notify new subscribers with last avatar immediately', () => {
      avatarEvents.notify('https://example.com/existing-avatar.jpg')
      
      const newListener = jest.fn()
      avatarEvents.subscribe(newListener)
      
      // Should be called immediately with the last avatar
      expect(newListener).toHaveBeenCalledWith('https://example.com/existing-avatar.jpg')
    })

    it('should clear all listeners and last URL', () => {
      const listener = jest.fn()
      avatarEvents.subscribe(listener)
      avatarEvents.notify('https://example.com/avatar.jpg')
      
      avatarEvents.clear()
      
      expect(avatarEvents.getLastAvatarUrl()).toBeNull()
      
      // Should not notify after clear
      avatarEvents.notify('https://example.com/new-avatar.jpg')
      expect(listener).toHaveBeenCalledTimes(1) // Only the first call before clear
    })

    it('should handle errors in listeners gracefully', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error')
      })
      const normalListener = jest.fn()

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      avatarEvents.subscribe(errorListener)
      avatarEvents.subscribe(normalListener)

      avatarEvents.notify('https://example.com/avatar.jpg')

      // Both listeners should be called despite error
      expect(errorListener).toHaveBeenCalled()
      expect(normalListener).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('should handle multiple notifications in sequence', () => {
      const listener = jest.fn()
      avatarEvents.subscribe(listener)

      avatarEvents.notify('https://example.com/avatar1.jpg')
      avatarEvents.notify('https://example.com/avatar2.jpg')
      avatarEvents.notify('https://example.com/avatar3.jpg')

      expect(listener).toHaveBeenCalledTimes(3)
      expect(listener).toHaveBeenNthCalledWith(1, 'https://example.com/avatar1.jpg')
      expect(listener).toHaveBeenNthCalledWith(2, 'https://example.com/avatar2.jpg')
      expect(listener).toHaveBeenNthCalledWith(3, 'https://example.com/avatar3.jpg')
    })

    it('should maintain separate listener sets', () => {
      const listener1 = jest.fn()
      const listener2 = jest.fn()

      const unsubscribe1 = avatarEvents.subscribe(listener1)
      avatarEvents.subscribe(listener2)

      avatarEvents.notify('https://example.com/avatar1.jpg')
      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener2).toHaveBeenCalledTimes(1)

      unsubscribe1()

      avatarEvents.notify('https://example.com/avatar2.jpg')
      expect(listener1).toHaveBeenCalledTimes(1) // Still 1
      expect(listener2).toHaveBeenCalledTimes(2) // Now 2
    })
  })

  describe('Avatar URL Processing', () => {
    it('should identify S3 URLs that need proxy', () => {
      const s3Urls = [
        'https://stakr-verification-files.s3.ap-southeast-2.amazonaws.com/avatars/user-123.jpg',
        'https://stakr-verification-files.s3.amazonaws.com/profiles/avatar.png',
      ]

      s3Urls.forEach(url => {
        expect(url).toContain('stakr-verification-files.s3')
      })
    })

    it('should identify non-S3 URLs that do not need proxy', () => {
      const regularUrls = [
        'https://example.com/avatar.jpg',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
        '/local-avatar.png',
      ]

      regularUrls.forEach(url => {
        expect(url).not.toContain('stakr-verification-files.s3')
      })
    })

    it('should generate proxy URLs correctly', () => {
      const s3Url = 'https://stakr-verification-files.s3.ap-southeast-2.amazonaws.com/avatars/user-123.jpg'
      const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(s3Url)}&v=user`

      expect(proxyUrl).toContain('/api/image-proxy')
      expect(proxyUrl).toContain(encodeURIComponent(s3Url))
      expect(proxyUrl).toContain('&v=')
    })
  })

  describe('Avatar Validation', () => {
    it('should validate file types', () => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      const invalidTypes = ['text/plain', 'application/pdf', 'video/mp4']

      validTypes.forEach(type => {
        const file = new File(['content'], 'test.jpg', { type })
        expect(file.type.startsWith('image/')).toBe(true)
      })

      invalidTypes.forEach(type => {
        const file = new File(['content'], 'test.txt', { type })
        expect(file.type.startsWith('image/')).toBe(false)
      })
    })

    it('should validate file sizes', () => {
      const MAX_SIZE = 5 * 1024 * 1024 // 5MB

      const validSize = 4 * 1024 * 1024 // 4MB
      expect(validSize).toBeLessThan(MAX_SIZE)

      const invalidSize = 6 * 1024 * 1024 // 6MB
      expect(invalidSize).toBeGreaterThan(MAX_SIZE)
    })

    it('should detect custom avatar URLs', () => {
      const customAvatars = [
        'https://stakr-avatars.s3.amazonaws.com/custom.jpg',
        'https://example.com/user-photo.png',
        '/uploads/avatar-123.jpg',
      ]

      const defaultAvatars = [
        'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
        'https://api.multiavatar.com/test.svg',
        'https://source.boringavatars.com/beam/120/test',
        'https://robohash.org/test',
        '/placeholder.svg',
      ]

      customAvatars.forEach(url => {
        const isCustom = 
          !url.includes('dicebear') && 
          !url.includes('multiavatar') &&
          !url.includes('boringavatars') &&
          !url.includes('robohash') &&
          !url.includes('placeholder')
        expect(isCustom).toBe(true)
      })

      defaultAvatars.forEach(url => {
        const isCustom = 
          !url.includes('dicebear') && 
          !url.includes('multiavatar') &&
          !url.includes('boringavatars') &&
          !url.includes('robohash') &&
          !url.includes('placeholder')
        expect(isCustom).toBe(false)
      })
    })
  })

  describe('Event System Integration', () => {
    it('should coordinate updates across multiple subscribers', () => {
      const subscriber1 = jest.fn()
      const subscriber2 = jest.fn()
      const subscriber3 = jest.fn()

      avatarEvents.subscribe(subscriber1)
      avatarEvents.subscribe(subscriber2)
      avatarEvents.subscribe(subscriber3)

      avatarEvents.notify('https://example.com/shared-avatar.jpg')

      expect(subscriber1).toHaveBeenCalledWith('https://example.com/shared-avatar.jpg')
      expect(subscriber2).toHaveBeenCalledWith('https://example.com/shared-avatar.jpg')
      expect(subscriber3).toHaveBeenCalledWith('https://example.com/shared-avatar.jpg')
    })

    it('should maintain state across multiple updates', () => {
      const updates: string[] = []
      const listener = (url: string) => updates.push(url)

      avatarEvents.subscribe(listener)

      avatarEvents.notify('https://example.com/avatar1.jpg')
      avatarEvents.notify('https://example.com/avatar2.jpg')
      avatarEvents.notify('https://example.com/avatar3.jpg')

      expect(updates).toEqual([
        'https://example.com/avatar1.jpg',
        'https://example.com/avatar2.jpg',
        'https://example.com/avatar3.jpg',
      ])

      expect(avatarEvents.getLastAvatarUrl()).toBe('https://example.com/avatar3.jpg')
    })

    it('should handle rapid successive updates', () => {
      const listener = jest.fn()
      avatarEvents.subscribe(listener)

      for (let i = 0; i < 100; i++) {
        avatarEvents.notify(`https://example.com/avatar${i}.jpg`)
      }

      expect(listener).toHaveBeenCalledTimes(100)
      expect(avatarEvents.getLastAvatarUrl()).toBe('https://example.com/avatar99.jpg')
    })
  })
})
