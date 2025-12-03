import type React from "react"
import type { Metadata, Viewport } from "next"
import { Montserrat, Inter, Space_Grotesk, JetBrains_Mono, Plus_Jakarta_Sans, Oswald, Outfit, Nunito, Chakra_Petch, Teko, Manrope, Bricolage_Grotesque } from "next/font/google"
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

// Original
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: '--font-montserrat' })
const inter = Inter({ subsets: ["latin"], variable: '--font-inter' })
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: '--font-space-grotesk' })
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: '--font-jetbrains-mono' })

// Option A: Premium Editorial / Personality
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: '--font-plus-jakarta' })
const manrope = Manrope({ subsets: ["latin"], variable: '--font-manrope' })
const oswald = Oswald({ subsets: ["latin"], variable: '--font-oswald' })
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: '--font-bricolage' })

// Option B: Friendly
const outfit = Outfit({ subsets: ["latin"], variable: '--font-outfit' })
const nunito = Nunito({ subsets: ["latin"], variable: '--font-nunito' })

// Option C: Bold/Hardcore
const chakraPetch = Chakra_Petch({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: '--font-chakra' })
const teko = Teko({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: '--font-teko' })


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
      <body className={cn(
        "bg-background font-sans antialiased", 
        montserrat.variable, 
        inter.variable,
        spaceGrotesk.variable,
        jetbrainsMono.variable,
        plusJakarta.variable,
        oswald.variable,
        manrope.variable,
        bricolage.variable,
        outfit.variable,
        nunito.variable,
        chakraPetch.variable,
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
