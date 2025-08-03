"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Home, Search, Trophy, Wallet, Settings, LogOut, Plus, Menu, X, Shield, DollarSign, Users, Bug } from "lucide-react"
import { Logo } from "@/components/logo"
import { NotificationDropdown } from "@/components/notifications/notification-dropdown"
import { useEnhancedMobile } from "@/hooks/use-enhanced-mobile"
import { useAvatar } from "@/hooks/use-avatar"
import { cn } from "@/lib/utils"

interface NavigationUser {
  name: string
  avatar: string
  credits: number
  activeStakes: number
  isAdmin?: boolean
  isDev?: boolean
}

interface NavigationProps {
  user: NavigationUser
  onLogout?: () => void | Promise<void>
}

export function Navigation({ user, onLogout }: NavigationProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isMobile } = useEnhancedMobile()
  const { avatarUrl } = useAvatar()

  const navItems = [
    { id: "active", label: "My Active", icon: Trophy, href: "/my-active" },
    { id: "discover", label: "Discover", icon: Search, href: "/discover" },
    { id: "social", label: "Social", icon: Users, href: "/social" },
  ]

  const getActiveTab = () => {
    if (pathname.startsWith("/my-active")) return "active"
    if (pathname.startsWith("/discover")) return "discover"
    if (pathname.startsWith("/social")) return "social"
    if (pathname === "/" || pathname.startsWith("/dashboard")) return "dashboard"
    return ""
  }

  const activeTab = getActiveTab()

  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    } else {
      // Fallback for when no logout handler is provided
      console.log("Logging out...")
      router.push("/")
    }
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Logo variant="full" className="h-8" />
          </Link>

          {/* Desktop Navigation - Hidden on mobile since we use bottom nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <Link key={item.id} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`flex items-center gap-2 font-medium relative ${
                      isActive
                        ? "bg-primary text-white hover:bg-primary/90 after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-8 after:h-0.5 after:bg-white after:rounded-full"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Create Challenge Button */}
            <Link href="/create-challenge">
              <Button
                size="sm"
                className="hidden sm:flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-white font-bold"
                title="Host your own challenge"
              >
                <Plus className="w-4 h-4" />
                HOST CHALLENGE
              </Button>
            </Link>

            {/* Credits Display */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">${user.credits}</span>
            </div>

            {/* Notifications */}
            <NotificationDropdown />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar 
                    className="h-10 w-10"
                    key={`nav-avatar-${avatarUrl}`} // Force re-render when avatar changes
                  >
                    <AvatarImage 
                      src={avatarUrl || user.avatar || "/placeholder.svg"} 
                      alt={user.name} 
                      onLoad={() => console.log('🖼️ Navigation avatar loaded:', avatarUrl)}
                    />
                    <AvatarFallback className="bg-primary text-white font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      ${user.credits} credits • {user.activeStakes} active stakes
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">
                    <Home className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <Wallet className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/my-challenges" className="cursor-pointer">
                    <Trophy className="mr-2 h-4 w-4" />
                    <span>My Challenges</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/wallet" className="cursor-pointer">
                    <Wallet className="mr-2 h-4 w-4" />
                    <span>Wallet</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/pricing" className="cursor-pointer">
                    <DollarSign className="mr-2 h-4 w-4" />
                    <span>Pricing & Fees</span>
                  </Link>
                </DropdownMenuItem>
                {user.isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                {user.isDev && (
                  <DropdownMenuItem asChild>
                    <Link href="/dev-tools" className="cursor-pointer">
                      <Bug className="mr-2 h-4 w-4" />
                      <span>Dev Tools</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <div className="px-4 py-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <Link key={item.id} href={item.href}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        isActive ? "bg-primary text-white" : "text-muted-foreground"
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {Icon && <Icon className="w-4 h-4 mr-2" />}
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
