"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight } from "lucide-react"
import Link from "next/link"

interface CreationLayoutProps {
  children: ReactNode
  currentStep: number
  totalSteps: number
  onNext: () => void
  onPrevious: () => void
  canProceed: boolean
  isLoading?: boolean
}

const stepTitles = [
  "Choose Privacy Type",
  "Select Challenge Category",
  "Basic Challenge Details",
  "Features & Participants",
  "Rules & Requirements",
  "Proof Settings",
  "Stakes & Rewards",
  "Preview & Publish",
]

export function CreationLayout({
  children,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  canProceed,
  isLoading = false,
}: CreationLayoutProps) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0A0A0A] dark:via-[#1A1A1A] dark:to-[#0F0F0F] relative overflow-hidden flex flex-col has-bottom-cta"
      style={{ ['--bottom-cta-height' as any]: '80px' }}
    >
      {/* Ambient Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[#F46036] rounded-full mix-blend-screen filter blur-[120px] opacity-10 dark:opacity-15 animate-pulse"></div>
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-[#D74E25] rounded-full mix-blend-screen filter blur-[100px] opacity-[0.07] dark:opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Noise Texture */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <div className="relative z-10 bg-white/80 dark:bg-background/95 border-b border-slate-200 dark:border-gray-200 sticky top-0 z-40 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                          <Link href="/">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </Link>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-xl font-bold text-foreground">Create Challenge</h1>
                <p className="text-sm text-muted-foreground">
                  Step {currentStep} of {totalSteps}: {stepTitles[currentStep - 1]}
                </p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 flex-1">
        <Card className="shadow-lg">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-primary">{stepTitles[currentStep - 1]}</CardTitle>
              <div className="flex items-center gap-2">
                {Array.from({ length: totalSteps }, (_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      i + 1 === currentStep ? "bg-primary" : i + 1 < currentStep ? "bg-secondary" : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pb-8">{children}</CardContent>
        </Card>

        {/* Navigation - sticks just above bottom nav */}
        <div
          className="flex items-center justify-between mt-8 bg-background/95 backdrop-blur border-t"
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 'var(--bottom-nav-safe-space, 0px)',
            zIndex: 60,
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
          }}
        >
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={currentStep === 1 || isLoading}
            className="flex items-center gap-2 bg-transparent"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>

          {currentStep < totalSteps ? (
            <Button
              onClick={onNext}
              disabled={!canProceed || isLoading}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold"
            >
              Next Step
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={onNext}
              disabled={!canProceed || isLoading}
              className="flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-white font-bold"
            >
              {isLoading ? "Publishing..." : "Publish Challenge"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
