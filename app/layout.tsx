import type React from "react"
import type { Metadata, Viewport } from "next"
import { Montserrat, Inter } from "next/font/google"
import { cn } from "@/lib/utils"
import "./globals.css"
import { NavigationWrapper } from "@/components/navigation-wrapper"
import { Toaster } from "@/components/ui/sonner"
import { Providers } from "@/components/providers"

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
      <body className={cn("bg-background font-sans antialiased", montserrat.className)}>
        <Providers>
          <NavigationWrapper />
          <main>{children}</main>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
