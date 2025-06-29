import type React from "react"
import type { Metadata } from "next"
import { Montserrat } from "next/font/google"
import { cn } from "@/lib/utils"
import "./globals.css"
import { NavigationWrapper } from "@/components/navigation-wrapper"
import { Toaster } from "@/components/ui/sonner"
import { Providers } from "@/components/providers"

const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] })

export const metadata: Metadata = {
  title: "Stakr - Challenge Yourself",
  description:
    "A bold, challenge-based self-growth app where users stake money or credits to commit to personal challenges.",
  generator: "v0.dev",
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
