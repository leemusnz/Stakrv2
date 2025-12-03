/**
 * Stakr Theme System
 * Provides dark and light mode themes with consistent gamified aesthetics
 */

export type Theme = 'dark' | 'light'

export const themes = {
  dark: {
    // Backgrounds
    bgPrimary: 'from-[#0A0A0A] via-[#1A1A1A] to-[#0F0F0F]',
    bgCard: 'bg-black/40',
    bgCardHover: 'bg-black/50',
    bgInput: 'bg-white/5',
    bgInputHover: 'bg-white/10',
    
    // Borders
    border: 'border-white/10',
    borderHover: 'border-white/20',
    
    // Text
    textPrimary: 'text-white',
    textSecondary: 'text-slate-400',
    textMuted: 'text-slate-500',
    
    // Glass effects
    backdropBlur: 'backdrop-blur-2xl',
    shimmer: 'from-transparent via-white/5 to-transparent',
    
    // Ambient glows
    glowPrimary: 'bg-[#F46036]',
    glowSecondary: 'bg-[#D74E25]',
    glowOpacity: 'opacity-15',
    
    // Image overlay
    imageOverlay: 'from-black/80 via-black/70 to-black/80',
    imageGrayscale: 'grayscale-[50%]',
    
    // Noise
    noiseOpacity: 'opacity-[0.015]',
  },
  light: {
    // Backgrounds
    bgPrimary: 'from-slate-50 via-white to-slate-100',
    bgCard: 'bg-white/80',
    bgCardHover: 'bg-white/90',
    bgInput: 'bg-slate-100/50',
    bgInputHover: 'bg-slate-100',
    
    // Borders
    border: 'border-slate-200',
    borderHover: 'border-slate-300',
    
    // Text
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-600',
    textMuted: 'text-slate-400',
    
    // Glass effects
    backdropBlur: 'backdrop-blur-xl',
    shimmer: 'from-transparent via-black/5 to-transparent',
    
    // Ambient glows
    glowPrimary: 'bg-[#F46036]',
    glowSecondary: 'bg-[#D74E25]',
    glowOpacity: 'opacity-10',
    
    // Image overlay
    imageOverlay: 'from-white/80 via-white/70 to-white/80',
    imageGrayscale: 'grayscale-[30%]',
    
    // Noise
    noiseOpacity: 'opacity-[0.02]',
  },
}

// Shared gamification colors (work in both themes)
export const gamification = {
  // Primary brand gradient
  gradient: 'from-[#F46036] to-[#D74E25]',
  gradientHover: 'from-[#ff724c] to-[#e85a30]',
  
  // XP and progress
  xpGradient: 'from-[#F46036] to-[#D74E25]',
  xpGlow: 'shadow-orange-500/20',
  
  // Levels
  levelBadge: 'bg-gradient-to-br from-[#F46036] to-[#D74E25]',
  
  // Stats
  statPositive: 'text-green-400',
  statNegative: 'text-red-400',
  statNeutral: 'text-slate-400',
  
  // Achievements
  achievementGold: 'from-yellow-400 to-yellow-600',
  achievementSilver: 'from-slate-300 to-slate-500',
  achievementBronze: 'from-orange-400 to-orange-600',
  
  // Status indicators
  statusActive: 'from-[#F46036]/20 to-[#D74E25]/20 border-[#F46036]/30 text-[#F46036]',
  statusComplete: 'from-green-500/20 to-green-600/20 border-green-500/30 text-green-400',
  statusPending: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30 text-yellow-400',
  statusFailed: 'from-red-500/20 to-red-600/20 border-red-500/30 text-red-400',
}

export function getTheme(theme: Theme) {
  return themes[theme]
}


