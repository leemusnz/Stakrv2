import type React from "react"
import type { Metadata } from "next"
import { Montserrat } from "next/font/google"
import { cn } from "@/lib/utils"
import "./globals.css"
import { Navigation } from "@/components/navigation"
import { NotificationProvider } from "@/components/notifications/notification-provider"
import { Toaster } from "@/components/ui/sonner"

const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] })

export const metadata: Metadata = {
  title: "Stakr - Challenge Yourself",
  description:
    "A bold, challenge-based self-growth app where users stake money or credits to commit to personal challenges.",
  generator: "v0.dev",
}

// Mock user data for demonstration purposes.
const mockUser = {
  name: "Alex Starr",
  avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
  credits: 1250,
  activeStakes: 3,
  isAdmin: true, // Enable admin access for demo
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("bg-background font-sans antialiased", montserrat.className)}>
        <NotificationProvider>
          <Navigation user={mockUser} />
          <main>{children}</main>
          <Toaster />
        </NotificationProvider>
      </body>
    </html>
  )
}
