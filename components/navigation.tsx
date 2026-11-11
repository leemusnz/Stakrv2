"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  Search,
  Trophy,
  Wallet,
  Settings,
  LogOut,
  Plus,
  Shield,
  Receipt,
  Bug,
  User,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { ThemeToggle } from "@/components/theme-toggle";
import { useEnhancedMobile } from "@/hooks/use-enhanced-mobile";
import { useAvatar } from "@/hooks/use-avatar";
import { cn } from "@/lib/utils";
import { CREDITS_CHANGED } from "@/lib/credit-events";

interface NavigationUser {
  name: string;
  avatar: string;
  isAdmin?: boolean;
  isDev?: boolean;
}

/** The signed-in user's real credit balance, refreshed on every page change. */
export function useCreditBalance() {
  const pathname = usePathname();
  const [balance, setBalance] = useState<number | null>(null);
  const [version, setVersion] = useState(0);
  // Refetch after anything that may have moved credits, not only on page changes.
  useEffect(() => {
    const bump = () => setVersion((n) => n + 1);
    window.addEventListener(CREDITS_CHANGED, bump);
    return () => window.removeEventListener(CREDITS_CHANGED, bump);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/user/credits", { cache: "no-store", signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const value = Number(d?.wallet?.balance);
        if (Number.isFinite(value)) setBalance(value);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [pathname, version]);
  return balance;
}

const formatCredits = (value: number) =>
  value.toLocaleString("en-NZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

interface NavigationProps {
  user: NavigationUser;
  onLogout?: () => void | Promise<void>;
}

export function Navigation({ user, onLogout }: NavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isMobile } = useEnhancedMobile();
  const { avatarUrl } = useAvatar();
  const balance = useCreditBalance();

  const navItems = [
    { id: "dashboard", label: "Home", icon: Home, href: "/dashboard" },
    { id: "discover", label: "Discover", icon: Search, href: "/discover" },
    {
      id: "active",
      label: "My challenges",
      icon: Trophy,
      href: "/my-challenges",
    },
  ];

  const getActiveTab = () => {
    if (
      pathname.startsWith("/my-challenges") ||
      pathname.startsWith("/my-active")
    )
      return "active";
    if (pathname.startsWith("/discover")) return "discover";
    if (pathname === "/" || pathname.startsWith("/dashboard"))
      return "dashboard";
    return "";
  };

  const activeTab = getActiveTab();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      // Fallback for when no logout handler is provided
      router.push("/alpha-gate");
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto px-4">
        <div className="relative flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Logo variant="full" className="h-8" />
          </Link>

          {/* Desktop Navigation - Hidden on mobile since we use bottom nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <Link key={item.id} href={item.href}>
                  <Button
                    aria-current={isActive ? "page" : undefined}
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
              );
            })}
          </div>

          {/* Mobile-only centered Create CTA */}
          <div className="md:hidden absolute left-1/2 -translate-x-1/2">
            <Link href="/create-challenge" aria-label="Create challenge">
              <Button
                size="sm"
                className="h-9 px-3 rounded-full flex items-center gap-1 bg-primary hover:bg-primary/90 text-white font-medium"
                title="Create a challenge"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Right Side: theme toggle, credits, notifications, avatar */}
          <div className="flex items-center gap-3 justify-end">
            {/* Theme Toggle - Desktop */}
            <div className="hidden md:block">
              <ThemeToggle />
            </div>

            {/* Desktop create button (restored) */}
            <Link
              href="/create-challenge"
              className="hidden md:block"
              aria-label="Create challenge (desktop)"
            >
              <Button
                size="sm"
                className="flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-white font-semibold"
                title="Create a challenge"
              >
                <Plus className="w-4 h-4" />
                Host Challenge
              </Button>
            </Link>

            {/* Real credit balance (no cash value, so never shown with a currency sign) */}
            {balance !== null && (
              <Link
                href="/wallet"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg hover:bg-muted/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label={`${formatCredits(balance)} credits. Open your credit history`}
              >
                <Wallet className="w-4 h-4 text-primary shrink-0" aria-hidden />
                <span className="font-semibold text-sm">
                  {formatCredits(balance)} credits
                </span>
              </Link>
            )}

            {/* Notifications */}
            <NotificationDropdown />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                  aria-label={`${user.name} user menu`}
                >
                  <Avatar
                    className="h-10 w-10"
                    key={`nav-avatar-${avatarUrl}`} // Force re-render when avatar changes
                  >
                    <AvatarImage
                      src={avatarUrl || user.avatar || "/placeholder.svg"}
                      alt={user.name}
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
                    <p className="text-sm font-medium leading-none">
                      {user.name}
                    </p>
                    {balance !== null && (
                      <p className="text-xs leading-none text-muted-foreground">
                        {formatCredits(balance)} credits
                      </p>
                    )}
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
                    <User className="mr-2 h-4 w-4" />
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
                    <span>Credits</span>
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
                    <Receipt className="mr-2 h-4 w-4" />
                    <span>Pricing & Fees</span>
                  </Link>
                </DropdownMenuItem>
                {user.isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin/challenges" className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                {/* /dev-tools only exists outside production (middleware 404s it there). */}
                {user.isDev && process.env.NODE_ENV !== "production" && (
                  <DropdownMenuItem asChild>
                    <Link href="/dev-tools" className="cursor-pointer">
                      <Bug className="mr-2 h-4 w-4" />
                      <span>Dev Tools</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Mobile menu button removed per design request */}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <div className="px-4 py-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <Link key={item.id} href={item.href}>
                    <Button
                      aria-current={isActive ? "page" : undefined}
                      variant={isActive ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        isActive
                          ? "bg-primary text-white"
                          : "text-muted-foreground",
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {Icon && <Icon className="w-4 h-4 mr-2" />}
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
