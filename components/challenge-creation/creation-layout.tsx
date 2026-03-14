"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight } from "lucide-react"
import Link from "next/link"
import { FloatingAmbientGlows } from "@/components/floating-ambient-glows"
import { BackgroundImage } from '@/components/ui/background-image'

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
      {/* Background Image */}
      <div className="absolute inset-0 overflow-hidden">
        <BackgroundImage 
          src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1920&q=80"
          alt="Challenge creation background"
          className="w-full h-full object-cover grayscale-[40%] dark:grayscale-[60%]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-white/75 to-white/85 dark:from-black/85 dark:via-black/75 dark:to-black/85"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-black via-transparent to-white/50 dark:to-black/50"></div>
      </div>

      {/* Ambient Glows */}
      <FloatingAmbientGlows />

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
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#F46036] to-[#D74E25] rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
          <div className="relative bg-white/80 dark:bg-black/40 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl dark:shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 dark:via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative pb-6 pt-6 px-6 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-heading font-bold text-[#F46036]">{stepTitles[currentStep - 1]}</h3>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalSteps }, (_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        i + 1 === currentStep ? "bg-[#F46036]" : i + 1 < currentStep ? "bg-[#D74E25]" : "bg-slate-300 dark:bg-slate-600"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="relative pb-8 px-6 pt-6">{children}</div>
          </div>
        </div>

        {/* Navigation - sticks just above bottom nav */}
        <div
          className="flex items-center justify-between mt-8 bg-background/95 backdrop-blur border-t px-4 py-4"
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
              className="flex items-center gap-2 bg-gradient-to-r from-[#F46036] to-[#D74E25] hover:from-[#ff724c] hover:to-[#e85a30] text-white font-heading font-bold shadow-lg shadow-orange-500/20"
            >
              Next Step
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={onNext}
              disabled={!canProceed || isLoading}
              className="flex items-center gap-2 bg-gradient-to-r from-[#F46036] to-[#D74E25] hover:from-[#ff724c] hover:to-[#e85a30] text-white font-heading font-bold shadow-lg shadow-orange-500/20"
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
