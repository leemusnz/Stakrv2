'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navigation } from './navigation'
import { Button } from './ui/button'
import Link from 'next/link'

export function NavigationWrapper() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Show loading state
  if (status === 'loading') {
    return (
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-8 w-24 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-8 w-20 bg-muted animate-pulse rounded" />
        </div>
      </nav>
    )
  }

  // Show login/signup nav if not authenticated
  if (!session) {
    return (
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold">Stakr</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link href="/discover">
              <Button variant="ghost">Browse Challenges</Button>
            </Link>
            <Link href="/onboarding">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>
    )
  }

  // Create user object from session with proxy URL for S3 images
  const rawAvatar = session.user?.image || ''
  let avatarUrl = rawAvatar
  
  // Use image proxy for S3 URLs to match the settings page behavior
  if (rawAvatar && rawAvatar.includes('stakr-verification-files.s3')) {
    const stableTimestamp = rawAvatar.split('/').pop()?.split('-')[0] || 'default'
    avatarUrl = `/api/image-proxy?url=${encodeURIComponent(rawAvatar)}&v=${stableTimestamp}`
  }
  
  const navigationUser = {
    name: session.user?.name || 'User',
    avatar: avatarUrl,
    credits: session.user?.credits || 0,
    activeStakes: 2, // This would come from API call in real app
    isAdmin: session.user?.isAdmin || false
  }



  // Enhanced logout handler
  const handleLogout = async () => {
    await signOut({ 
      callbackUrl: '/',
      redirect: true 
    })
  }

  // Return your existing Navigation with real user data and logout
  return (
    <Navigation 
      user={navigationUser}
      onLogout={handleLogout}
    />
  )
}
