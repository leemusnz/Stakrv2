"use client"

import { ChallengeCard } from "@/components/challenge-card"
import { notFound } from 'next/navigation'

// Production guard - only allow in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  notFound()
}
import { Sparkles } from "lucide-react"

export default function DesignPreviewPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 relative overflow-hidden">
      {/* Mesh Gradient Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-400/30 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-400/30 blur-[100px] animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur border border-orange-100 shadow-sm">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-bold text-slate-600">Project Juice: Design Preview</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            Modern <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">Gamification</span>
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg">
            Comparing the new "Juicy" card style with enhanced physics, gradients, and glassmorphism.
          </p>
        </div>

        {/* FONT COMPARISON SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-8 bg-white/50 backdrop-blur-xl rounded-3xl border border-white/50 overflow-x-auto">
            {/* Current */}
            <div className="space-y-4 min-w-[250px]">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current (Safe)</h3>
                <div className="p-6 bg-white rounded-xl shadow-sm space-y-4 h-full">
                    <h2 className="text-2xl font-bold text-slate-900 font-[family-name:var(--font-montserrat)]">Level Up Your Life</h2>
                    <p className="text-slate-500 font-[family-name:var(--font-inter)]">Complete challenges to earn rewards.</p>
                    <div className="flex items-baseline gap-1 font-[family-name:var(--font-montserrat)]">
                        <span className="text-3xl font-bold text-orange-600">$5,240</span>
                        <span className="text-xs text-slate-400 uppercase">total pot</span>
                    </div>
                </div>
            </div>

            {/* Option A */}
            <div className="space-y-4 min-w-[250px]">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">A: Modern + Personality</h3>
                <div className="p-6 bg-white rounded-xl shadow-sm space-y-4 h-full">
                    <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-bricolage)' }}>Level Up Your Life</h2>
                    <p className="text-slate-500 font-[family-name:var(--font-inter)]">Complete challenges to earn rewards.</p>
                    <div className="flex items-baseline gap-1" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                        <span className="text-3xl font-bold text-orange-600">$5,240</span>
                        <span className="text-xs text-slate-400 uppercase font-bold tracking-wide">total pot</span>
                    </div>
                </div>
            </div>
            
            {/* Option B */}
            <div className="space-y-4 min-w-[250px]">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">B: Friendly & Fun</h3>
                <div className="p-6 bg-white rounded-xl shadow-sm space-y-4 h-full">
                    <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-outfit)' }}>Level Up Your Life</h2>
                    <p className="text-slate-500 font-[family-name:var(--font-nunito)]">Complete challenges to earn rewards.</p>
                    <div className="flex items-baseline gap-1" style={{ fontFamily: 'var(--font-nunito)' }}>
                        <span className="text-3xl font-black text-orange-600">$5,240</span>
                        <span className="text-xs text-slate-400 uppercase font-bold">total pot</span>
                    </div>
                </div>
            </div>

             {/* Option D */}
             <div className="space-y-4 min-w-[250px]">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">D: The Mix (Quirky + Digital)</h3>
                <div className="p-6 bg-white rounded-xl shadow-sm space-y-4 h-full">
                    <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-bricolage)' }}>Level Up Your Life</h2>
                    <p className="text-slate-500 font-[family-name:var(--font-inter)]">Complete challenges to earn rewards.</p>
                    <div className="flex items-baseline gap-1" style={{ fontFamily: 'var(--font-teko)' }}>
                        <span className="text-4xl font-medium text-orange-600">$5,240</span>
                        <span className="text-xs text-slate-400 uppercase tracking-widest font-sans">total pot</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
          {/* Card 1: Fitness */}
          <ChallengeCard 
            title="30-Day Abs Blaster"
            category="Fitness"
            stakeAmount={50}
            participants={2340}
            duration="30 Days"
            difficulty="Hard"
            isPopular={true}
            imageUrl="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&auto=format&fit=crop&q=60"
            hostAvatarUrl="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60"
          />

          {/* Card 2: Mindfulness (Active) */}
          <ChallengeCard 
            title="Morning Meditation"
            category="Mindfulness"
            stakeAmount={25}
            participants={892}
            duration="21 Days"
            difficulty="Easy"
            progress={65}
            imageUrl="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=60"
            hostAvatarUrl="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=60"
          />

          {/* Card 3: Productivity - BRAND EXAMPLE */}
          <ChallengeCard 
            title="Deep Work Protocol"
            category="Productivity"
            stakeAmount={100}
            participants={156}
            duration="14 Days"
            difficulty="Medium"
            imageUrl="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=60"
            hostAvatarUrl="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/1667px-Apple_logo_black.svg.png"
          />
        </div>

        <div className="p-8 rounded-3xl bg-white/50 backdrop-blur-xl border border-white/40 shadow-xl text-center space-y-4">
          <h2 className="text-2xl font-bold text-slate-800">Why this works better:</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold">1</div>
              <h3 className="font-bold text-slate-900">Glassmorphism</h3>
              <p className="text-sm text-slate-500">Layers and translucency create depth, making the app feel like a premium digital object.</p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 font-bold">2</div>
              <h3 className="font-bold text-slate-900">Vibrant Gradients</h3>
              <p className="text-sm text-slate-500">Moving away from flat colors to dynamic gradients increases perceived energy.</p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold">3</div>
              <h3 className="font-bold text-slate-900">Juicy Physics</h3>
              <p className="text-sm text-slate-500">Cards float on hover and "squish" on tap, providing satisfying tactile feedback.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

