'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { Navigation } from './navigation'
import { MobileBottomNavigation } from './mobile-bottom-navigation'
import { Button } from './ui/button'
import Link from 'next/link'
import { Logo } from './logo'

export function NavigationWrapper() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  // Check if we're on onboarding or auth pages
  const isOnOnboarding = pathname?.startsWith('/onboarding')
  const isOnAuthPage = pathname?.startsWith('/auth/') || pathname === '/auth'

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

  // Show contextual nav if not authenticated
  if (!session) {
    return (
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Logo variant="full" className="h-8" />
          </Link>
          
          <div className="flex items-center gap-4">
            {/* Show different navigation based on context */}
            {isOnOnboarding ? (
              // During onboarding - minimal, focused navigation
              <>
                <Link href="/auth/signin">
                  <Button variant="ghost" className="text-muted-foreground">
                    Already have an account? Sign In
                  </Button>
                </Link>
              </>
            ) : isOnAuthPage ? (
              // On auth pages - simple navigation
              <>
                <Link href="/onboarding">
                  <Button variant="ghost">Get Started</Button>
                </Link>
              </>
            ) : (
              // Regular pages - full navigation
              <>
                <Link href="/discover">
                  <Button variant="ghost">Browse Challenges</Button>
                </Link>
                <Link href="/auth/signin">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/onboarding">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
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
    <>
      <Navigation 
        user={navigationUser}
        onLogout={handleLogout}
      />
      <MobileBottomNavigation 
        notificationCount={0} // This would come from API call in real app
        onCreateChallenge={() => router.push('/create-challenge')}
      />
    </>
  )
}
