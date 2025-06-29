// Avatar management system for Stakr
export interface AvatarOption {
  id: string
  name: string
  type: 'service' | 'generated'
  url: string
  category?: string
  description?: string
}

// Generate avatars from various free services
const generateServiceAvatars = (seed?: string): AvatarOption[] => {
  const userSeed = seed || 'stakr-user'
  
  return [
    // DiceBear - Multiple high-quality styles
    {
      id: 'avataaars',
      name: 'Cartoon Person',
      type: 'service' as const,
      url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9&scale=80`,
      category: 'characters',
      description: 'Cartoon-style character avatar'
    },
    {
      id: 'big-smile',
      name: 'Happy Face',
      type: 'service' as const,
      url: `https://api.dicebear.com/7.x/big-smile/svg?seed=${userSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9&scale=80`,
      category: 'characters',
      description: 'Cheerful smiling character'
    },
    {
      id: 'lorelei',
      name: 'Illustrated',
      type: 'service' as const,
      url: `https://api.dicebear.com/7.x/lorelei/svg?seed=${userSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9&scale=80`,
      category: 'characters',
      description: 'Beautiful illustrated character'
    },
    {
      id: 'micah',
      name: 'Modern',
      type: 'service' as const,
      url: `https://api.dicebear.com/7.x/micah/svg?seed=${userSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9&scale=80`,
      category: 'characters',
      description: 'Modern minimalist design'
    },
    {
      id: 'miniavs',
      name: 'Mini Character',
      type: 'service' as const,
      url: `https://api.dicebear.com/7.x/miniavs/svg?seed=${userSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9&scale=80`,
      category: 'characters',
      description: 'Cute mini character'
    },
    {
      id: 'open-peeps',
      name: 'Open Peeps',
      type: 'service' as const,
      url: `https://api.dicebear.com/7.x/open-peeps/svg?seed=${userSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9&scale=80`,
      category: 'characters',
      description: 'Diverse illustrated people'
    },
    
    // Multiavatar - Character avatars
    {
      id: 'multiavatar-1',
      name: 'Character Style',
      type: 'service' as const,
      url: `https://api.multiavatar.com/${userSeed}.svg`,
      category: 'generated',
      description: 'Unique character from Multiavatar'
    },
    {
      id: 'multiavatar-2',
      name: 'Alt Character',
      type: 'service' as const,
      url: `https://api.multiavatar.com/${userSeed}2.svg`,
      category: 'generated',
      description: 'Alternative character style'
    },
    
    // Boring Avatars - Geometric/Abstract
    {
      id: 'boring-marble',
      name: 'Marble',
      type: 'service' as const,
      url: `https://source.boringavatars.com/marble/80/${userSeed}?colors=264653,2a9d8f,e9c46a,f4a261,e76f51`,
      category: 'abstract',
      description: 'Marble-like abstract pattern'
    },
    {
      id: 'boring-beam',
      name: 'Beam',
      type: 'service' as const,
      url: `https://source.boringavatars.com/beam/80/${userSeed}?colors=264653,2a9d8f,e9c46a,f4a261,e76f51`,
      category: 'abstract',
      description: 'Geometric beam design'
    },
    {
      id: 'boring-pixel',
      name: 'Pixel Art',
      type: 'service' as const,
      url: `https://source.boringavatars.com/pixel/80/${userSeed}?colors=264653,2a9d8f,e9c46a,f4a261,e76f51`,
      category: 'abstract',
      description: 'Retro pixel art style'
    },
    {
      id: 'boring-sunset',
      name: 'Sunset',
      type: 'service' as const,
      url: `https://source.boringavatars.com/sunset/80/${userSeed}?colors=264653,2a9d8f,e9c46a,f4a261,e76f51`,
      category: 'abstract',
      description: 'Sunset gradient design'
    },
    
    // RoboHash - Fun robot/creature avatars
    {
      id: 'robohash-robot',
      name: 'Robot',
      type: 'service' as const,
      url: `https://robohash.org/${userSeed}?set=set1&size=80x80`,
      category: 'fun',
      description: 'Unique robot avatar'
    },
    {
      id: 'robohash-monster',
      name: 'Monster',
      type: 'service' as const,
      url: `https://robohash.org/${userSeed}?set=set2&size=80x80`,
      category: 'fun',
      description: 'Friendly monster avatar'
    },
    {
      id: 'robohash-cat',
      name: 'Robot Cat',
      type: 'service' as const,
      url: `https://robohash.org/${userSeed}?set=set4&size=80x80`,
      category: 'fun',
      description: 'Cute robot cat'
    },
    
    // Adorable Avatars - Simple character style
    {
      id: 'adorable-1',
      name: 'Adorable',
      type: 'service' as const,
      url: `https://api.adorable.io/avatars/80/${userSeed}`,
      category: 'characters',
      description: 'Simple adorable character'
    }
  ]
}

// Get all available avatars
export function getAllAvatars(userSeed?: string): AvatarOption[] {
  return generateServiceAvatars(userSeed)
}

// Get avatars by category
export function getAvatarsByCategory(category: string, userSeed?: string): AvatarOption[] {
  const allAvatars = getAllAvatars(userSeed)
  return allAvatars.filter(avatar => avatar.category === category)
}

// Get a random avatar
export function getRandomAvatar(userSeed?: string): AvatarOption {
  const allAvatars = getAllAvatars(userSeed)
  const randomIndex = Math.floor(Math.random() * allAvatars.length)
  return allAvatars[randomIndex]
}

// Get default avatar for new users
export function getDefaultAvatar(userSeed?: string): AvatarOption {
  const avatars = generateServiceAvatars(userSeed)
  return avatars[0] // Cartoon Person as default
}

// Generate a personalized avatar based on user's email
export function getPersonalizedAvatar(email: string): AvatarOption {
  const seed = email.split('@')[0] // Use username part of email as seed
  const personalizedAvatars = generateServiceAvatars(seed)
  return personalizedAvatars[0] // Return first avatar with user's seed
}

// Avatar categories for organization
export const avatarCategories = [
  { id: 'characters', name: 'Characters', description: 'Illustrated people and characters' },
  { id: 'abstract', name: 'Abstract', description: 'Geometric and artistic designs' },
  { id: 'fun', name: 'Fun', description: 'Robots, monsters, and creatures' },
  { id: 'generated', name: 'Generated', description: 'Unique AI-generated avatars' }
]

// Validate avatar URL
export function isValidAvatarUrl(url: string): boolean {
  return (
    url.startsWith('https://api.dicebear.com/') ||
    url.startsWith('https://api.multiavatar.com/') ||
    url.startsWith('https://source.boringavatars.com/') ||
    url.startsWith('https://robohash.org/') ||
    url.startsWith('https://api.adorable.io/') ||
    url.startsWith('/avatars/') ||
    url.startsWith('data:image/')
  )
}

// Create avatar URL for saving to database
export function createAvatarUrl(avatarId: string, userSeed?: string): string {
  const avatar = getAllAvatars(userSeed).find(a => a.id === avatarId)
  return avatar?.url || getDefaultAvatar(userSeed).url
} 