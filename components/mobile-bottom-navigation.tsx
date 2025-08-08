"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useEnhancedMobile } from "@/hooks/use-enhanced-mobile"
import { cn } from "@/lib/utils"
import { 
  Home, 
  Search, 
  Trophy, 
  Users, 
  User,
  Plus,
  Bell
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface NavigationItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  badge?: number
}

interface MobileBottomNavigationProps {
  onCreateChallenge?: () => void
  notificationCount?: number
  className?: string
}

export function MobileBottomNavigation({ 
  onCreateChallenge, 
  notificationCount = 0,
  className 
}: MobileBottomNavigationProps) {
  const { isMobile } = useEnhancedMobile()
  const pathname = usePathname()

  // Don't show on desktop or certain pages
  if (!isMobile) return null
  
  // Hide on onboarding and auth pages
  if (pathname.includes('/onboarding') || pathname.includes('/auth')) return null

  const navigationItems: NavigationItem[] = [
    { 
      id: "dashboard", 
      label: "Home", 
      icon: Home, 
      href: "/dashboard" 
    },
    { 
      id: "discover", 
      label: "Discover", 
      icon: Search, 
      href: "/discover" 
    },
    { 
      id: "active", 
      label: "Active", 
      icon: Trophy, 
      href: "/my-active" 
    },
    { 
      id: "social", 
      label: "Social", 
      icon: Users, 
      href: "/social" 
    },
    { 
      id: "profile", 
      label: "Profile", 
      icon: User, 
      href: "/profile" 
    }
  ]

  const getActiveTab = () => {
    if (pathname === "/" || pathname === "/dashboard") return "dashboard"
    if (pathname.startsWith("/discover")) return "discover"
    if (pathname.startsWith("/my-active")) return "active"
    if (pathname.startsWith("/social")) return "social"
    if (pathname.startsWith("/profile") || pathname.startsWith("/settings")) return "profile"
    return ""
  }

  const activeTab = getActiveTab()

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50",
      "bg-background/95 backdrop-blur-sm border-t border-border",
      "safe-area-bottom",
      className
    )}>
      {/* Main Navigation */}
      <div className="grid grid-cols-5 px-2 py-1">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          
          return (
            <Link key={item.id} href={item.href}>
              <button
                className={cn(
                  "flex flex-col items-center justify-center",
                  "py-2 px-3 rounded-lg",
                  "min-h-[56px] touch-manipulation",
                  "transition-all duration-200 ease-out",
                  "active:scale-95 active:bg-muted/50",
                  isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
              >
                <div className="relative">
                  <Icon className={cn(
                    "w-5 h-5 mb-1 transition-transform duration-200",
                    isActive && "scale-110"
                  )} />
                  {item.badge && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs flex items-center justify-center"
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </Badge>
                  )}
                </div>
                <span className={cn(
                  "text-xs font-medium leading-none",
                  isActive && "font-semibold"
                )}>
                  {item.label}
                </span>
              </button>
            </Link>
          )
        })}
      </div>

      {/* Floating Action Button for Create Challenge */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2">
        <Button
          onClick={onCreateChallenge || (() => window.location.href = '/create-challenge')}
          className={cn(
            "h-12 w-12 rounded-full shadow-lg",
            "bg-primary hover:bg-primary/90 text-primary-foreground",
            "touch-manipulation active:scale-95",
            "transition-all duration-200 ease-out"
          )}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {/* Notification Indicator */}
      {notificationCount > 0 && (
        <div className="absolute top-2 right-4">
          <Link href="/notifications">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-full p-0 touch-manipulation active:scale-95"
            >
              <div className="relative">
                <Bell className="w-4 h-4" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-3 w-3 p-0 text-xs flex items-center justify-center"
                >
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Badge>
              </div>
            </Button>
          </Link>
        </div>
      )}
      
      {/* Safe area padding for devices with home indicators */}
      <div className="h-[env(safe-area-inset-bottom)] bg-background/95" />
    </div>
  )
}

// Hook to manage bottom navigation state
export function useMobileBottomNavigation() {
  const { isMobile } = useEnhancedMobile()
  const pathname = usePathname()
  
  const isVisible = isMobile && 
    !pathname.includes('/onboarding') && 
    !pathname.includes('/auth') &&
    !pathname.includes('/alpha-gate')
  
  const getBottomPadding = () => {
    return isVisible ? "pb-20 safe-area-bottom" : ""
  }
  
  return {
    isVisible,
    getBottomPadding,
    shouldShowNavigation: isVisible
  }
}

// Higher-order component to add bottom padding when nav is visible
export function withMobileNavigation<T extends object>(
  Component: React.ComponentType<T>
) {
  return function WrappedComponent(props: T) {
    const { getBottomPadding } = useMobileBottomNavigation()
    
    return (
      <div className={getBottomPadding()}>
        <Component {...props} />
      </div>
    )
  }
}
