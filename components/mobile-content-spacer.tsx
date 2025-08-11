"use client"

import { useMobileBottomNavigation } from "./mobile-bottom-navigation"

export function MobileContentSpacer() {
  const { isVisible } = useMobileBottomNavigation()

  if (!isVisible) return null

  return (
    <div
      className="bottom-nav-spacer md:hidden"
      aria-hidden
    />
  )
}


