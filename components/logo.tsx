interface LogoProps {
  variant?: "full" | "icon"
  theme?: "dark" | "light"
  size?: "sm" | "md" | "lg"
  className?: string
}

export function Logo({ variant = "full", theme = "dark", size = "md", className = "" }: LogoProps) {
  const sizeClasses = {
    sm: variant === "icon" ? "w-6 h-6" : "h-4",
    md: variant === "icon" ? "w-8 h-8" : "h-6",
    lg: variant === "icon" ? "w-12 h-12" : "h-8",
  }

  const logoSrc =
    variant === "icon"
      ? theme === "light"
        ? "/logos/stakr-icon-white.png"
        : "/logos/stakr-icon.png"
      : theme === "light"
        ? "/logos/stakr-full-white.png"
        : "/logos/stakr-full.png"

  return <img src={logoSrc || "/placeholder.svg"} alt="Stakr" className={`${sizeClasses[size]} ${className}`} />
}
