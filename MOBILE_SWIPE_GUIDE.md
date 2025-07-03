# 📱 Mobile Swipe Detection & Cards Implementation Guide

## **Overview**

Your Stakr app now has comprehensive mobile detection capabilities! Here's how to implement swipe cards and mobile-optimized UI.

## **🔧 Enhanced Mobile Detection**

### **Available Hooks**

\`\`\`typescript
import { useEnhancedMobile, useSwipeGesture } from '@/hooks/use-enhanced-mobile'

// Comprehensive mobile detection
const { 
  isMobile,        // true if screen < 768px
  isTablet,        // true if 768px <= screen < 1024px
  isDesktop,       // true if screen >= 1024px
  isTouchDevice,   // true if device supports touch
  isIOS,           // true if iOS device
  isAndroid,       // true if Android device
  orientation,     // 'portrait' or 'landscape'
  screenSize       // { width: number, height: number }
} = useEnhancedMobile()

// Swipe gesture detection
const {
  swipeDirection,  // { direction: 'left'|'right'|'up'|'down', distance: number }
  onTouchStart,    // Touch event handlers
  onTouchEnd,
  onTouchMove,
  clearSwipe       // Reset swipe state
} = useSwipeGesture(threshold?: number, timeout?: number)
\`\`\`

## **📋 Implementation Examples**

### **1. Challenge Discovery Swipe Cards**

\`\`\`typescript
// In your discover page component
import { useEnhancedMobile, useSwipeGesture } from '@/hooks/use-enhanced-mobile'

export function ChallengeDiscovery() {
  const { isMobile, isTouchDevice } = useEnhancedMobile()
  const [currentIndex, setCurrentIndex] = useState(0)
  
  if (isMobile) {
    // Mobile: Show swipe cards
    return <MobileSwipeCards challenges={challenges} />
  } else {
    // Desktop: Show grid layout  
    return <DesktopGrid challenges={challenges} />
  }
}
\`\`\`

### **2. Swipeable Challenge Card**

\`\`\`typescript
function SwipeableCard({ challenge, onLike, onPass }) {
  const { swipeDirection, onTouchStart, onTouchEnd, onTouchMove } = useSwipeGesture()
  
  useEffect(() => {
    if (!swipeDirection) return
    
    if (swipeDirection.direction === 'right' && swipeDirection.distance > 100) {
      onLike(challenge)
    } else if (swipeDirection.direction === 'left' && swipeDirection.distance > 100) {
      onPass(challenge)
    }
  }, [swipeDirection])
  
  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchMove={onTouchMove}
      className="w-full h-96 relative"
    >
      <ChallengeCard challenge={challenge} />
      
      {/* Swipe indicators */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2">
        {swipeDirection?.direction === 'left' && <PassIcon />}
      </div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2">
        {swipeDirection?.direction === 'right' && <LikeIcon />}
      </div>
    </div>
  )
}
\`\`\`

### **3. Responsive Layout Component**

\`\`\`typescript
function ResponsiveLayout({ children }) {
  const { isMobile, isTablet } = useEnhancedMobile()
  
  return (
    <div className={cn(
      "grid gap-4",
      isMobile ? "grid-cols-1" : 
      isTablet ? "grid-cols-2" : 
      "grid-cols-3"
    )}>
      {children}
    </div>
  )
}
\`\`\`

## **🎯 Specific Use Cases for Stakr**

### **1. Challenge Discovery Page**
- **Mobile**: Tinder-style swipe cards
- **Desktop**: Grid with hover effects
- **Tablet**: 2-column grid

### **2. User Dashboard** 
- **Mobile**: Vertical stack, larger buttons
- **Desktop**: Multi-column layout

### **3. Challenge Creation**
- **Mobile**: Step-by-step wizard with swipe navigation
- **Desktop**: Side-by-side form and preview

### **4. Social Feed**
- **Mobile**: Full-width cards, swipe to like
- **Desktop**: Multi-column masonry layout

## **📱 Mobile-Specific Features to Implement**

### **Swipe Gestures**
\`\`\`typescript
// In any component
const { isMobile } = useEnhancedMobile()

if (isMobile) {
  return (
    <SwipeCard
      onSwipeLeft={() => handleReject()}
      onSwipeRight={() => handleAccept()}
      onSwipeUp={() => handleBookmark()}
    >
      <YourContent />
    </SwipeCard>
  )
}
\`\`\`

### **Touch-Optimized UI**
\`\`\`typescript
<Button 
  size={isMobile ? "lg" : "default"}
  className={isMobile ? "min-h-[48px] text-base" : ""}
>
  Touch-friendly button
</Button>
\`\`\`

### **Orientation Handling**
\`\`\`typescript
const { orientation, screenSize } = useEnhancedMobile()

return (
  <div className={cn(
    "flex",
    orientation === 'portrait' ? "flex-col" : "flex-row"
  )}>
    <YourContent />
  </div>
)
\`\`\`

## **🚀 Quick Implementation Steps**

### **Step 1: Update Existing Components**

Replace existing mobile detection:
\`\`\`typescript
// Before
import { useIsMobile } from '@/hooks/use-mobile'
const isMobile = useIsMobile()

// After  
import { useEnhancedMobile } from '@/hooks/use-enhanced-mobile'
const { isMobile, isTouchDevice, isIOS } = useEnhancedMobile()
\`\`\`

### **Step 2: Add Swipe to Challenge Cards**

In `components/challenge-card.tsx`:
\`\`\`typescript
export function ChallengeCard({ challenge, mobile = false }) {
  const { isMobile } = useEnhancedMobile()
  
  if (isMobile && mobile) {
    return <SwipeableChallengeCard challenge={challenge} />
  }
  
  return <RegularChallengeCard challenge={challenge} />
}
\`\`\`

### **Step 3: Create Mobile-First Pages**

\`\`\`typescript
// pages/discover/mobile.tsx
export function MobileDiscoverPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Discover Challenges</h1>
      <p className="text-muted-foreground mb-6">
        Swipe right to join, left to pass
      </p>
      <ChallengeSwipeStack challenges={challenges} />
    </div>
  )
}
\`\`\`

## **🔧 Testing Mobile Features**

### **Chrome DevTools**
1. Open DevTools (F12)
2. Click device toggle (Ctrl+Shift+M)
3. Select mobile device
4. Test swipe gestures with mouse drag

### **Real Device Testing**
- Test on actual iOS/Android devices
- Check touch responsiveness
- Verify swipe sensitivity
- Test orientation changes

## **⚡ Performance Tips**

### **Conditional Loading**
\`\`\`typescript
const { isMobile } = useEnhancedMobile()

// Only load heavy components on desktop
const AdvancedChart = lazy(() => import('./AdvancedChart'))

return (
  <div>
    {isMobile ? (
      <SimpleChart data={data} />
    ) : (
      <Suspense fallback={<Loading />}>
        <AdvancedChart data={data} />
      </Suspense>
    )}
  </div>
)
\`\`\`

### **Touch Event Optimization**
\`\`\`typescript
// Use passive listeners for better scroll performance
useEffect(() => {
  const handleTouch = (e) => { /* handle touch */ }
  
  element.addEventListener('touchstart', handleTouch, { passive: true })
  element.addEventListener('touchmove', handleTouch, { passive: false }) // Only preventDefault when needed
  
  return () => {
    element.removeEventListener('touchstart', handleTouch)
    element.removeEventListener('touchmove', handleTouch)
  }
}, [])
\`\`\`

## **📋 Next Steps**

1. **Test the enhanced mobile detection** in your existing components
2. **Implement swipe cards** for challenge discovery 
3. **Add mobile-specific layouts** to key pages
4. **Optimize touch interactions** throughout the app
5. **Test on real devices** for best UX

**Your app can now intelligently adapt to any device and provide native-feeling mobile experiences!** 🎉
