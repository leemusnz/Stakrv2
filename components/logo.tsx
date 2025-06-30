interface LogoProps {
  variant?: "full" | "icon"
  theme?: "dark" | "light"
  size?: "sm" | "md" | "lg"
  className?: string
}

export function Logo({ variant = "full", theme = "dark", size = "md", className = "" }: LogoProps) {
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

  return (
    <img 
      src={logoSrc} 
      alt="Stakr - Challenge-Based Self-Improvement" 
      className={`${sizeClasses[size]} ${className} object-contain`}
      onError={(e) => {
        const target = e.target as HTMLImageElement
        if (!target.src.includes('stakr-full.png')) {
          target.src = '/logos/stakr-full.png'
        }
      }}
    />
  )
}
