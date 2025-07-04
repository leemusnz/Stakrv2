"use client"

import { useState } from "react"
import { MobileContainer, MobileSectionWrapper } from "@/components/mobile-container"
import { DashboardMobile } from "@/components/dashboard-mobile"
import { DiscoverMobile } from "@/components/discover-mobile"
import { MobileActivityFeed } from "@/components/mobile-activity-feed"
import { MobileProofSubmission } from "@/components/mobile-proof-submission"
import { 
  MobileModal, 
  MobileActionModal, 
  MobileConfirmModal, 
  MobileFormModal,
  useMobileModal 
} from "@/components/mobile-modal"
import { 
  AnimatedButton, 
  FloatingActionButton, 
  RippleButton,
  MobileLoadingSkeleton,
  SuccessAnimation,
  haptic
} from "@/components/mobile-interactions"
import { SwipeableListItem, InteractiveCard } from "@/components/gesture-wrapper"
import { SwipeableTabs } from "@/components/ui/swipeable-tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEnhancedMobile } from "@/hooks/use-enhanced-mobile"
import { 
  Plus, 
  Heart, 
  Star, 
  Share2, 
  Trash2, 
  Edit, 
  Archive,
  Camera,
  TestTube,
  Smartphone,
  Zap,
  Sparkles
} from "lucide-react"

export default function MobileDemoPage() {
  const { isMobile } = useEnhancedMobile()
  const [activeTab, setActiveTab] = useState("components")
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Modal states
  const basicModal = useMobileModal()
  const actionModal = useMobileModal()
  const confirmModal = useMobileModal()
  const formModal = useMobileModal()

  if (!isMobile) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Mobile Demo</h1>
        <p className="text-muted-foreground">
          This demo is designed for mobile devices. Please view on a mobile device or use browser mobile simulation.
        </p>
      </div>
    )
  }

  // Component Showcase Tab
  const ComponentsTab = () => (
    <div className="space-y-8">
      {/* Buttons Section */}
      <MobileSectionWrapper title="Interactive Buttons" subtitle="Haptic feedback and animations">
        <div className="grid grid-cols-2 gap-3">
          <AnimatedButton hapticType="light" animationType="scale">
            Tap Me
          </AnimatedButton>
          <AnimatedButton hapticType="medium" animationType="bounce" variant="outline">
            Bounce
          </AnimatedButton>
          <AnimatedButton hapticType="heavy" animationType="shake" variant="destructive">
            Shake
          </AnimatedButton>
          <AnimatedButton hapticType="success" animationType="glow">
            Success
          </AnimatedButton>
        </div>
        
        <div className="mt-4 space-y-3">
          <RippleButton 
            className="w-full p-4 bg-primary text-primary-foreground rounded-lg font-medium"
            onClick={() => console.log("Ripple effect!")}
          >
            Ripple Effect Button
          </RippleButton>
          
          <Button 
            onClick={() => setShowSuccess(true)}
            className="w-full"
          >
            Show Success Animation
          </Button>
        </div>
      </MobileSectionWrapper>

      {/* Modals Section */}
      <MobileSectionWrapper title="Mobile Modals" subtitle="Bottom sheets on mobile, dialogs on desktop">
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={basicModal.open} variant="outline">
            Basic Modal
          </Button>
          <Button onClick={actionModal.open} variant="outline">
            Action Modal
          </Button>
          <Button onClick={confirmModal.open} variant="outline">
            Confirm Modal
          </Button>
          <Button onClick={formModal.open} variant="outline">
            Form Modal
          </Button>
        </div>
      </MobileSectionWrapper>

      {/* Gesture Components */}
      <MobileSectionWrapper title="Gesture Controls" subtitle="Swipe, tap, and long press interactions">
        <div className="space-y-4">
          <SwipeableListItem
            onEdit={() => console.log("Edit")}
            onDelete={() => console.log("Delete")}
            onShare={() => console.log("Share")}
          >
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-1">Swipeable List Item</h4>
                <p className="text-sm text-muted-foreground">
                  Swipe left to delete, right to edit, up to share
                </p>
              </CardContent>
            </Card>
          </SwipeableListItem>
          
          <InteractiveCard
            onTap={() => console.log("Single tap")}
            onDoubleTap={() => {
              console.log("Double tap")
              haptic.medium()
            }}
            onLongPress={() => {
              console.log("Long press")
              haptic.heavy()
            }}
            swipeActions={[
              {
                direction: "left",
                icon: "❤️",
                label: "Like",
                onAction: () => console.log("Liked"),
                threshold: 100
              }
            ]}
          >
            <CardContent className="p-4">
              <h4 className="font-medium mb-1">Interactive Card</h4>
              <p className="text-sm text-muted-foreground">
                Tap, double tap, long press, or swipe for actions
              </p>
            </CardContent>
          </InteractiveCard>
        </div>
      </MobileSectionWrapper>

      {/* Loading States */}
      <MobileSectionWrapper title="Loading States" subtitle="Mobile-optimized skeleton screens">
        <div className="space-y-4">
          <MobileLoadingSkeleton lines={2} showAvatar />
          <MobileLoadingSkeleton lines={3} />
          <MobileLoadingSkeleton lines={1} showAvatar />
        </div>
      </MobileSectionWrapper>

      {/* Proof Submission */}
      <MobileSectionWrapper title="Proof Submission" subtitle="Mobile-first form with camera integration">
        <MobileProofSubmission
          challengeId="demo"
          challengeTitle="Mobile Demo Challenge"
          onSubmit={async (data) => {
            console.log("Proof submitted:", data)
            await new Promise(resolve => setTimeout(resolve, 1000))
          }}
        />
      </MobileSectionWrapper>
    </div>
  )

  // Patterns Tab
  const PatternsTab = () => (
    <div className="space-y-8">
      <MobileSectionWrapper title="Navigation Patterns" subtitle="Bottom navigation and floating actions">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Bottom Navigation</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Thumb-friendly navigation at the bottom of the screen
              </p>
              <Badge variant="outline">✓ Currently Active</Badge>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Floating Action Button</h4>
              <p className="text-sm text-muted-foreground">
                Quick access to primary actions
              </p>
            </CardContent>
          </Card>
        </div>
      </MobileSectionWrapper>

      <MobileSectionWrapper title="Layout Patterns" subtitle="Card-based and swipeable designs">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Swipeable Tabs</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Natural gesture navigation between content sections
              </p>
              <Badge variant="outline">Used in Dashboard & Discover</Badge>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Card-based Layout</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Information organized in digestible, swipeable cards
              </p>
              <Badge variant="outline">Used Throughout App</Badge>
            </CardContent>
          </Card>
        </div>
      </MobileSectionWrapper>

      <MobileSectionWrapper title="Interaction Patterns" subtitle="Gesture-based and touch-optimized">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Swipe-to-Action</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Quick actions through intuitive swipe gestures
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">👈 Delete</Badge>
                <Badge variant="outline">👉 Edit</Badge>
                <Badge variant="outline">👆 Archive</Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Multi-Touch Gestures</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Support for tap, double-tap, and long-press
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">👆 Tap</Badge>
                <Badge variant="outline">👆👆 Double Tap</Badge>
                <Badge variant="outline">👆📱 Long Press</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </MobileSectionWrapper>
    </div>
  )

  // Features Tab
  const FeaturesTab = () => (
    <div className="space-y-8">
      <MobileSectionWrapper title="Implemented Features" subtitle="Complete mobile experience">
        <div className="space-y-4">
          {[
            { title: "Horizontal Scroll Fix", description: "No more accidental horizontal scrolling", status: "✅" },
            { title: "Bottom Navigation", description: "Thumb-friendly navigation", status: "✅" },
            { title: "Swipeable Dashboard", description: "Card-based overview with gesture navigation", status: "✅" },
            { title: "Tinder-style Discovery", description: "Swipe to browse and join challenges", status: "✅" },
            { title: "Mobile Modals", description: "Bottom sheets for native feel", status: "✅" },
            { title: "Gesture Support", description: "Comprehensive touch interactions", status: "✅" },
            { title: "Haptic Feedback", description: "Touch feedback for better UX", status: "✅" },
            { title: "Micro-animations", description: "Smooth, delightful interactions", status: "✅" },
          ].map((feature, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                  <span className="text-lg">{feature.status}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </MobileSectionWrapper>

      <MobileSectionWrapper title="Device Support" subtitle="Optimized for all mobile devices">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span>Safe Area Support</span>
            <Badge variant="default">✓</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span>Touch Targets (44px+)</span>
            <Badge variant="default">✓</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span>Responsive Typography</span>
            <Badge variant="default">✓</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span>Orientation Support</span>
            <Badge variant="default">✓</Badge>
          </div>
        </div>
      </MobileSectionWrapper>
    </div>
  )

  const tabs = [
    {
      value: "components",
      label: "Components",
      content: <ComponentsTab />
    },
    {
      value: "patterns",
      label: "Patterns",
      content: <PatternsTab />
    },
    {
      value: "features",
      label: "Features",
      content: <FeaturesTab />
    }
  ]

  return (
    <MobileContainer className="pb-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Smartphone className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Mobile Demo</h1>
        </div>
        <p className="text-muted-foreground">
          Experience the enhanced mobile UX
        </p>
      </div>

      {/* Demo Tabs */}
      <SwipeableTabs
        tabs={tabs}
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
        tabsListClassName="grid-cols-3"
      />

      {/* Floating Action Button */}
      <FloatingActionButton
        icon={<Plus className="w-6 h-6" />}
        onClick={() => console.log("FAB clicked!")}
        variant="primary"
      />

      {/* Modals */}
      <MobileModal
        {...basicModal.props}
        title="Basic Modal"
        description="This modal automatically becomes a bottom sheet on mobile devices."
      >
        <div className="space-y-4">
          <p>This demonstrates the automatic modal adaptation for mobile devices.</p>
          <Button onClick={basicModal.close} className="w-full">
            Close
          </Button>
        </div>
      </MobileModal>

      <MobileActionModal
        {...actionModal.props}
        title="Action Modal"
        description="Modal with predefined actions"
        primaryAction={{
          label: "Confirm",
          onClick: actionModal.close,
          variant: "default"
        }}
        secondaryAction={{
          label: "Cancel",
          onClick: actionModal.close,
          variant: "outline"
        }}
      >
        <p>This modal has built-in action buttons.</p>
      </MobileActionModal>

      <MobileConfirmModal
        {...confirmModal.props}
        title="Confirm Action"
        description="Are you sure you want to proceed?"
        onConfirm={confirmModal.close}
      />

      <MobileFormModal
        {...formModal.props}
        title="Form Modal"
        description="Modal with form validation"
        onSubmit={() => {
          setShowSuccess(true)
          formModal.close()
        }}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="demo-input">Name</Label>
            <Input id="demo-input" placeholder="Enter your name" className="text-base" />
          </div>
          <div>
            <Label htmlFor="demo-email">Email</Label>
            <Input id="demo-email" type="email" placeholder="Enter your email" className="text-base" />
          </div>
        </div>
      </MobileFormModal>

      {/* Success Animation */}
      <SuccessAnimation
        show={showSuccess}
        onComplete={() => setShowSuccess(false)}
        message="Action completed successfully!"
      />
    </MobileContainer>
  )
} 