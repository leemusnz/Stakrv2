// Mobile-First Optimization Enhancements for Stakr
// This file demonstrates improved mobile patterns you should implement

"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useIsMobile } from "@/hooks/use-mobile"

// 1. MOBILE-FIRST BUTTON SIZES
// Current: Some buttons might be too small for touch
// Improved: Larger touch targets on mobile

export function MobileOptimizedButton({ children, ...props }: any) {
  const isMobile = useIsMobile()
  
  return (
    <Button 
      {...props}
      className={`
        ${props.className || ''}
        ${isMobile ? 'min-h-[48px] px-6 text-base' : ''}
        touch-manipulation select-none
      `}
    >
      {children}
    </Button>
  )
}

// 2. MOBILE-FIRST CARD LAYOUTS
// Current: Cards may have too much padding on mobile
// Improved: Responsive padding and spacing

export function MobileOptimizedCard({ children, ...props }: any) {
  return (
    <Card {...props} className={`${props.className || ''} touch-manipulation`}>
      <CardContent className="p-3 sm:p-4 md:p-6">
        {children}
      </CardContent>
    </Card>
  )
}

// 3. MOBILE-FIRST FORM INPUTS
// Current: Standard input sizing
// Improved: Larger touch targets and better mobile UX

export function MobileOptimizedInput({ ...props }: any) {
  return (
    <input
      {...props}
      className={`
        ${props.className || ''}
        h-12 text-base  // Larger height, bigger text
        px-4 py-3      // More padding for touch
        rounded-lg     // Friendly rounding
        touch-manipulation
        focus:ring-2 focus:ring-primary focus:border-primary
        transition-all duration-200
      `}
    />
  )
}

// 4. MOBILE-FIRST STAKES SLIDER
// Current: Default range input
// Improved: Touch-friendly with larger thumb

export function MobileOptimizedStakeSlider({ value, onChange, min, max }: any) {
  return (
    <div className="relative w-full">
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={onChange}
        className="
          w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer
          touch-manipulation
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:h-6
          [&::-webkit-slider-thumb]:w-6
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-primary
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:shadow-lg
          [&::-webkit-slider-thumb]:border-2
          [&::-webkit-slider-thumb]:border-white
          sm:[&::-webkit-slider-thumb]:h-4
          sm:[&::-webkit-slider-thumb]:w-4
        "
        style={{
          background: `linear-gradient(to right, #F46036 0%, #F46036 ${((value - min) / (max - min)) * 100}%, #e5e5e5 ${((value - min) / (max - min)) * 100}%, #e5e5e5 100%)`,
        }}
      />
    </div>
  )
}

// 5. MOBILE-FIRST NAVIGATION IMPROVEMENTS
// Current: Good mobile nav, but could be enhanced
// Improved: Bottom navigation for mobile

export function MobileBottomNavigation() {
  const navItems = [
    { id: "dashboard", label: "Home", icon: "🏠", href: "/" },
    { id: "discover", label: "Discover", icon: "🔍", href: "/discover" },
    { id: "social", label: "Social", icon: "👥", href: "/social" },
    { id: "profile", label: "Profile", icon: "👤", href: "/profile" },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="grid grid-cols-4 py-2">
        {navItems.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className="flex flex-col items-center py-2 px-3 touch-manipulation active:bg-gray-100"
          >
            <span className="text-xl mb-1">{item.icon}</span>
            <span className="text-xs font-medium text-gray-600">{item.label}</span>
          </a>
        ))}
      </div>
      {/* Safe area padding for newer phones */}
      <div className="h-safe-area-inset-bottom"></div>
    </div>
  )
}

// 6. MOBILE-FIRST CHALLENGE CARDS
// Current: Good but could be more touch-friendly
// Improved: Better mobile interaction patterns

export function MobileOptimizedChallengeCard({ challenge }: any) {
  return (
    <MobileOptimizedCard className="w-full">
      {/* Larger touch targets for mobile actions */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold leading-tight mb-2">{challenge.title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{challenge.description}</p>
        </div>
        
        {/* Mobile-optimized action buttons */}
        <div className="flex gap-2 ml-3">
          <Button 
            variant="ghost" 
            className="h-10 w-10 p-0 touch-manipulation rounded-full"
          >
            💖
          </Button>
          <Button 
            variant="ghost" 
            className="h-10 w-10 p-0 touch-manipulation rounded-full"
          >
            📱
          </Button>
        </div>
      </div>

      {/* Mobile-friendly stats */}
      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <span>⏱️</span>
          <span>{challenge.duration}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>👥</span>
          <span>{challenge.participants}</span>
        </div>
      </div>

      {/* Large, thumb-friendly join button */}
      <MobileOptimizedButton className="w-full bg-primary text-white font-bold">
        JOIN CHALLENGE
      </MobileOptimizedButton>
    </MobileOptimizedCard>
  )
}

// 7. MOBILE-FIRST RESPONSIVE UTILITIES
export const mobileOptimizations = {
  // Container spacing
  containerPadding: "px-4 sm:px-6 lg:px-8",
  
  // Content spacing
  sectionSpacing: "space-y-4 sm:space-y-6 lg:space-y-8",
  
  // Grid patterns
  responsiveGrid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6",
  
  // Typography
  headingText: "text-xl sm:text-2xl lg:text-3xl font-bold",
  bodyText: "text-base sm:text-sm",
  
  // Interactive elements
  touchTarget: "min-h-[44px] touch-manipulation select-none",
  
  // Safe areas
  bottomSafeArea: "pb-safe-area-inset-bottom",
  topSafeArea: "pt-safe-area-inset-top",
}

/*
IMPLEMENTATION CHECKLIST FOR MOBILE-FIRST STAKR:

✅ DONE:
- Responsive navigation
- Responsive grids
- Basic mobile breakpoints
- Mobile sidebar/drawer

🔧 TO IMPLEMENT:

1. **Touch Targets** (Critical):
   - All buttons min 44px height
   - Larger tap areas for small icons
   - Proper spacing between clickable elements

2. **Content Optimization**:
   - Reduce card padding on mobile
   - Optimize text sizes for mobile reading
   - Better line heights and spacing

3. **Input Enhancement**:
   - Larger form inputs (min 48px height)
   - Better focus states
   - Touch-friendly sliders and controls

4. **Navigation Improvements**:
   - Consider bottom tab navigation
   - Swipe gestures for tabs
   - Better mobile menu animations

5. **Performance Optimization**:
   - Lazy load images below fold
   - Optimize avatar images for mobile
   - Reduce bundle size for mobile

6. **Mobile-Specific Features**:
   - Pull-to-refresh on feeds
   - Native share API
   - Better modal/drawer transitions
   - Haptic feedback for interactions

7. **Safe Area Handling**:
   - Handle notched devices
   - Bottom safe area for navigation
   - Proper viewport meta tag

RECOMMENDED VIEWPORT META TAG:
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">

CSS ADDITIONS NEEDED:
@supports (padding: max(0px)) {
  .pb-safe-area-inset-bottom {
    padding-bottom: max(1rem, env(safe-area-inset-bottom));
  }
}
*/ 