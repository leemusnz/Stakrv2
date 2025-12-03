"use client"

import { ThemedBackground, ThemedCard, ThemedStatCard } from "@/components/themed-background"
import { XPBar, XPBadge } from "@/components/gamification/xp-badge"
import { StreakBadge } from "@/components/gamification/streak-badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { DollarSign, Shield, Trophy, TrendingUp, Heart, Zap, Target, Clock } from "lucide-react"

export default function ThemePreviewPage() {
  return (
    <ThemedBackground>
      <div className="container mx-auto p-6 space-y-8">
        {/* Header with Theme Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">
              Theme Preview
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg font-body mt-2">
              Toggle between light and dark modes to see the design system
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <ThemedStatCard
            label="Balance"
            value="$1,234.56"
            subtext="+$567.89 total earned"
            icon={<DollarSign className="h-5 w-5 text-[#F46036]" />}
            iconBg="primary"
          />
          <ThemedStatCard
            label="Trust Score"
            value="85/100"
            subtext="Excellent standing"
            icon={<Shield className="h-5 w-5 text-slate-600 dark:text-slate-300" />}
            iconBg="secondary"
          />
          <ThemedStatCard
            label="Streak"
            value="14 days"
            subtext="Best: 30 days"
            icon={<Trophy className="h-5 w-5 text-[#F46036]" />}
            iconBg="primary"
          />
          <ThemedStatCard
            label="Experience"
            value="12,500 XP"
            subtext="250 XP to Level 12"
            icon={<TrendingUp className="h-5 w-5 text-slate-600 dark:text-slate-300" />}
            iconBg="secondary"
          />
        </div>

        {/* Gamification Components */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* XP System */}
          <ThemedCard>
            <div className="p-6 space-y-4">
              <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white">XP System</h3>
              <div className="flex items-center gap-4">
                <XPBadge xp={12500} level={11} size="lg" />
                <div className="flex-1">
                  <XPBar currentXP={2500} xpForNextLevel={3000} level={11} />
                </div>
              </div>
            </div>
          </ThemedCard>

          {/* Streak System */}
          <ThemedCard>
            <div className="p-6">
              <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white mb-4">Streak System</h3>
              <StreakBadge currentStreak={14} longestStreak={30} size="sm" />
            </div>
          </ThemedCard>

          {/* Achievement */}
          <ThemedCard>
            <div className="p-6 space-y-4">
              <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white">Achievements</h3>
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full blur-xl shadow-yellow-500/30 opacity-50 animate-pulse"></div>
                  <div className="relative w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full flex items-center justify-center border-2 border-yellow-400/30 shadow-yellow-500/30 shadow-lg transition-all duration-300 group-hover:scale-110">
                    <Trophy className="w-10 h-10 text-white" />
                  </div>
                </div>
                <div className="text-sm">
                  <p className="font-heading font-bold text-slate-900 dark:text-white">Legend</p>
                  <p className="text-slate-600 dark:text-slate-400 font-body">Legendary Tier</p>
                </div>
              </div>
            </div>
          </ThemedCard>
        </div>

        {/* Challenge Cards */}
        <ThemedCard>
          <div className="p-6 border-b border-slate-200 dark:border-white/10">
            <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">Active Challenges</h2>
            <p className="text-slate-600 dark:text-slate-400 font-body mt-1">3 challenges in progress</p>
          </div>
          <div className="p-6 space-y-4">
            {[
              { title: "30-Day Fitness Streak", category: "Fitness", stake: 100, days: 15, icon: Heart },
              { title: "Morning Meditation", category: "Mindfulness", stake: 50, days: 7, icon: Zap },
              { title: "Learn Spanish", category: "Learning", stake: 75, days: 21, icon: Target },
            ].map((challenge, i) => (
              <div key={i} className="relative group/item">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#F46036] to-[#D74E25] rounded-xl opacity-0 group-hover/item:opacity-10 blur transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-300">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#F46036]/20 to-[#D74E25]/20 backdrop-blur-sm border border-[#F46036]/20 rounded-xl flex items-center justify-center">
                      <challenge.icon className="w-6 h-6 text-[#F46036]" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-heading font-bold text-slate-900 dark:text-white mb-1">{challenge.title}</h4>
                      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 font-body">
                        <span className="px-2 py-0.5 bg-slate-200 dark:bg-white/10 rounded text-xs font-medium">{challenge.category}</span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {challenge.stake}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {challenge.days}d left
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="bg-white/50 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white">
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ThemedCard>

        {/* Buttons Showcase */}
        <ThemedCard>
          <div className="p-6 space-y-6">
            <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">Button Styles</h2>
            <div className="flex flex-wrap gap-4">
              <Button className="bg-gradient-to-r from-[#F46036] to-[#D74E25] hover:from-[#ff724c] hover:to-[#e85a30] text-white font-heading font-bold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-300">
                Primary Action
              </Button>
              <Button variant="outline" className="bg-white/50 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10">
                Secondary Action
              </Button>
              <Button variant="ghost" className="text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10">
                Ghost Button
              </Button>
            </div>
          </div>
        </ThemedCard>

        {/* Typography Showcase */}
        <ThemedCard>
          <div className="p-6 space-y-6">
            <div>
              <h1 className="text-5xl font-heading font-bold text-slate-900 dark:text-white mb-2">Heading 1</h1>
              <p className="text-slate-600 dark:text-slate-400 font-body">Bricolage Grotesque - Bold, modern, distinctive</p>
            </div>
            <div>
              <h2 className="text-3xl font-heading font-bold text-slate-900 dark:text-white mb-2">Heading 2</h2>
              <p className="text-slate-600 dark:text-slate-400 font-body">Perfect for section titles</p>
            </div>
            <div>
              <p className="text-lg font-body text-slate-700 dark:text-slate-300 leading-relaxed">
                Body text uses Manrope - clean, readable, and professional. It works beautifully in both light and dark modes,
                maintaining excellent readability while looking modern and sophisticated.
              </p>
            </div>
            <div>
              <p className="text-2xl font-mono text-[#F46036] font-bold">$1,234.56</p>
              <p className="text-slate-600 dark:text-slate-400 font-body text-sm">Teko - Perfect for stats and numbers</p>
            </div>
          </div>
        </ThemedCard>

        {/* Color Palette */}
        <ThemedCard>
          <div className="p-6 space-y-6">
            <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">Color Palette</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-20 bg-gradient-to-r from-[#F46036] to-[#D74E25] rounded-xl shadow-lg"></div>
                <p className="text-sm font-body text-slate-700 dark:text-slate-300">Primary Gradient</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 bg-slate-900 dark:bg-white rounded-xl shadow-lg"></div>
                <p className="text-sm font-body text-slate-700 dark:text-slate-300">Text Primary</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 bg-slate-600 dark:bg-slate-400 rounded-xl shadow-lg"></div>
                <p className="text-sm font-body text-slate-700 dark:text-slate-300">Text Secondary</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 bg-slate-200 dark:bg-white/10 rounded-xl shadow-lg border border-slate-300 dark:border-white/20"></div>
                <p className="text-sm font-body text-slate-700 dark:text-slate-300">Surface</p>
              </div>
            </div>
          </div>
        </ThemedCard>
      </div>
    </ThemedBackground>
  )
}

