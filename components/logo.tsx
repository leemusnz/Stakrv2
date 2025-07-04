"use client"

import { useState } from "react"
import Image from "next/image"

interface LogoProps {
  variant?: "full" | "icon"
  theme?: "dark" | "light"
  size?: "sm" | "md" | "lg"
  className?: string
}

export function Logo({ variant = "full", theme = "dark", size = "md", className = "" }: LogoProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const sizeClasses = {
    sm: variant === "icon" ? "w-6 h-6" : "h-6",
    md: variant === "icon" ? "w-8 h-8" : "h-8", 
    lg: variant === "icon" ? "w-12 h-12" : "h-12",
  }

  const logoSrc =
    variant === "icon"
      ? "/logos/stakr-icon.png"
      : theme === "light"
        ? "/logos/stakr-full-white.png"
        : "/logos/stakr-full.png"

  // Fallback text logo with proper styling
  const TextLogo = () => (
    <div 
      className={`${sizeClasses[size]} ${className} flex items-center justify-center font-bold tracking-tight`}
      style={{ 
        color: theme === "light" ? "#ffffff" : "#FF6B35",
        fontSize: variant === "icon" ? "1rem" : "1.5rem"
      }}
    >
      <span className="relative">
        🏔️ {variant === "icon" ? "S" : "Stakr"}
      </span>
    </div>
  )

  // Show text logo immediately if image failed or while loading for faster UX
  if (imageError) {
    return <TextLogo />
  }

  return (
    <div className={`${sizeClasses[size]} ${className} relative flex items-center`}>
      <Image 
        src={logoSrc}
        alt="Stakr - Challenge-Based Self-Improvement"
        width={variant === "icon" ? 32 : 120}
        height={32}
        className="object-contain"
        priority={true}
        onLoad={() => {
          setIsLoading(false)
          console.log('✅ Logo loaded successfully:', logoSrc)
        }}
        onError={(e) => {
          console.log('❌ Logo failed to load:', logoSrc)
          setImageError(true)
          setIsLoading(false)
        }}
        style={{ 
          opacity: isLoading ? 0.5 : 1,
          transition: 'opacity 0.2s ease'
        }}
      />
      
      {/* Fallback overlay while loading */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <TextLogo />
        </div>
      )}
    </div>
  )
}
