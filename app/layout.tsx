import type React from "react"
import type { Metadata, Viewport } from "next"
import { Montserrat, Inter } from "next/font/google"
import { cn } from "@/lib/utils"
import "./globals.css"
import { NavigationWrapper } from "@/components/navigation-wrapper"
import { MobileContentSpacer } from "@/components/mobile-content-spacer"
import { Toaster } from "@/components/ui/sonner"
import { Providers } from "@/components/providers"
import { AppleSplashScreen } from "./apple-splash-screen"
import { MobileAppOptimizer, mobileAppStyles } from "@/components/mobile-app-optimizer"
import { PWARegistration } from "@/components/pwa-registration"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"
import { PWADebug } from "@/components/pwa-debug"

const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] })
const inter = Inter({ subsets: ["latin"] })

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
  maximumScale: 1,
  userScalable: false, // Prevents zoom on form focus
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
        <AppleSplashScreen />
        <style dangerouslySetInnerHTML={{ __html: mobileAppStyles }} />
      </head>
      <body className={cn("bg-background font-sans antialiased", montserrat.className)}>
        <MobileAppOptimizer />
        <PWARegistration />
        <Providers>
          <NavigationWrapper />
          <main style={{ paddingBottom: "var(--bottom-nav-safe-space, 0px)" }}>
            {children}
            {/* Spacer to prevent content from being hidden behind bottom nav on mobile */}
            <MobileContentSpacer />
          </main>
          <Toaster />
          <PWAInstallPrompt />
          <PWADebug />
        </Providers>
      </body>
    </html>
  )
}
