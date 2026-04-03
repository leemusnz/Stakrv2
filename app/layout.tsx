import type React from "react"
import type { Metadata, Viewport } from "next"
import { Teko, Manrope, Bricolage_Grotesque } from "next/font/google"
import { cn } from "@/lib/utils"
import "./globals.css"
import { NavigationWrapper } from "@/components/navigation-wrapper"
import { MobileContentSpacer } from "@/components/mobile-content-spacer"
import { Toaster } from "@/components/ui/sonner"
import { Providers } from "@/components/providers"
import { ThemeProvider } from "@/components/theme-provider"
import { AppleSplashScreen } from "./apple-splash-screen"
import { MobileAppOptimizer, mobileAppStyles } from "@/components/mobile-app-optimizer"
import { PWARegistration } from "@/components/pwa-registration"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"
import { PWADebug } from "@/components/pwa-debug"
import { Footer } from "@/components/footer"
import { ErrorBoundary } from "@/components/error-boundary"

// Active fonts (used in design system)
const manrope = Manrope({ subsets: ["latin"], variable: '--font-manrope', display: 'swap' })
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: '--font-bricolage', display: 'swap' })
const teko = Teko({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: '--font-teko', display: 'swap' })


export const metadata: Metadata = {
  title: "Stakr - Challenge-Based Self-Improvement",
  description: "Build better habits through accountable challenges with real stakes",
  // PWA and mobile app metadata
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Stakr'
  },
  // Apple-specific icons and splash screens
  icons: {
    apple: [
      { url: '/logos/stakr-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/logos/stakr-icon.png', sizes: '152x152', type: 'image/png' },
      { url: '/logos/stakr-icon.png', sizes: '120x120', type: 'image/png' }
    ],
    icon: [
      { url: '/logos/stakr-icon.png', sizes: '192x192', type: 'image/png' },
      { url: '/logos/stakr-icon.png', sizes: '512x512', type: 'image/png' }
    ]
  },
  generator: "v0.dev",
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F46036'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for faster resource loading */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <AppleSplashScreen />
        <style
          dangerouslySetInnerHTML={{
            // SAFE: mobileAppStyles is a hardcoded CSS string exported from mobile-app-optimizer.tsx.
            // It contains only static CSS rules for mobile optimization (viewport handling, touch targets, scrolling behavior, safe area insets).
            // No user input or dynamic content is included. Content is CSS-only with no user-controlled data.
            __html: mobileAppStyles,
          }}
        />
      </head>
      <body className={cn(
        "bg-background font-sans antialiased", 
        manrope.variable,
        bricolage.variable,
        teko.variable
      )}>
        <MobileAppOptimizer />
        <PWARegistration />
        <ThemeProvider>
          <Providers>
            <ErrorBoundary>
              <NavigationWrapper />
              <main style={{ paddingBottom: "var(--bottom-nav-safe-space, 0px)" }}>
                {children}
                {/* Spacer to prevent content from being hidden behind bottom nav on mobile */}
                <MobileContentSpacer />
              </main>
              <Footer />
            </ErrorBoundary>
            <Toaster />
            <PWAInstallPrompt />
            <PWADebug />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
