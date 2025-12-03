import Image from 'next/image'

interface IntegrationIconProps {
  provider: string
  size?: number
  className?: string
}

export function IntegrationIcon({ provider, size = 24, className = '' }: IntegrationIconProps) {
  // Map providers to their logo URLs (using official brand assets)
  const logoUrls: Record<string, string> = {
    // Wearables
    whoop: 'https://logo.clearbit.com/whoop.com',
    strava: 'https://logo.clearbit.com/strava.com',
    fitbit: 'https://logo.clearbit.com/fitbit.com',
    apple_watch: 'https://logo.clearbit.com/apple.com',
    garmin: 'https://logo.clearbit.com/garmin.com',
    google_fit: 'https://logo.clearbit.com/google.com',
    samsung_galaxy_watch: 'https://logo.clearbit.com/samsung.com',
    polar: 'https://logo.clearbit.com/polar.com',
    withings: 'https://logo.clearbit.com/withings.com',
    oura_ring: 'https://logo.clearbit.com/ouraring.com',
    
    // Apps
    myfitnesspal: 'https://logo.clearbit.com/myfitnesspal.com',
    headspace: 'https://logo.clearbit.com/headspace.com',
    duolingo: 'https://logo.clearbit.com/duolingo.com',
    github: 'https://logo.clearbit.com/github.com',
    spotify: 'https://logo.clearbit.com/spotify.com',
    noom: 'https://logo.clearbit.com/noom.com',
    coursera: 'https://logo.clearbit.com/coursera.com',
    khan_academy: 'https://logo.clearbit.com/khanacademy.org',
    youtube_music: 'https://logo.clearbit.com/youtube.com',
    goodreads: 'https://logo.clearbit.com/goodreads.com',
    todoist: 'https://logo.clearbit.com/todoist.com',
    notion: 'https://logo.clearbit.com/notion.so',
    linkedin_learning: 'https://logo.clearbit.com/linkedin.com',
  }
  
  const logoUrl = logoUrls[provider]
  
  // Fallback emojis if logo fails to load
  const fallbackEmojis: Record<string, string> = {
    whoop: '💪',
    strava: '🏃',
    fitbit: '⌚',
    apple_watch: '⌚',
    garmin: '⌚',
    google_fit: '📱',
    samsung_galaxy_watch: '⌚',
    polar: '⌚',
    withings: '⚖️',
    oura_ring: '💍',
    myfitnesspal: '🍎',
    headspace: '🧘',
    duolingo: '🦉',
    github: '🐙',
    spotify: '🎵',
    noom: '⚖️',
    coursera: '🎓',
    khan_academy: '📚',
    youtube_music: '🎶',
    goodreads: '📖',
    todoist: '✅',
    notion: '📝',
    linkedin_learning: '💼',
  }
  
  if (!logoUrl) {
    // Fallback to emoji if no logo URL
    return (
      <span className={`text-${size === 16 ? 'sm' : size === 20 ? 'base' : 'xl'} ${className}`}>
        {fallbackEmojis[provider] || '📱'}
      </span>
    )
  }
  
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <Image
        src={logoUrl}
        alt={`${provider} logo`}
        width={size}
        height={size}
        className="rounded object-contain"
        onError={(e) => {
          // Fallback to emoji if image fails to load
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
          if (target.parentElement) {
            target.parentElement.innerHTML = fallbackEmojis[provider] || '📱'
          }
        }}
      />
    </div>
  )
}

// Alternative: Simple emoji wrapper for backwards compatibility
export function IntegrationEmoji({ provider }: { provider: string }) {
  const emojis: Record<string, string> = {
    whoop: '💪',
    strava: '🏃',
    fitbit: '⌚',
    apple_watch: '⌚',
    garmin: '⌚',
    google_fit: '📱',
    samsung_galaxy_watch: '⌚',
    polar: '⌚',
    withings: '⚖️',
    oura_ring: '💍',
    myfitnesspal: '🍎',
    headspace: '🧘',
    duolingo: '🦉',
    github: '🐙',
    spotify: '🎵',
    noom: '⚖️',
    coursera: '🎓',
    khan_academy: '📚',
    youtube_music: '🎶',
    goodreads: '📖',
    todoist: '✅',
    notion: '📝',
    linkedin_learning: '💼',
  }
  
  return <span className="text-2xl">{emojis[provider] || '📱'}</span>
}

