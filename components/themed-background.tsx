"use client"

import { ReactNode } from "react"
import { FloatingAmbientGlows } from "./floating-ambient-glows"

interface ThemedBackgroundProps {
  children: ReactNode
  className?: string
}

export function ThemedBackground({ children, className = "" }: ThemedBackgroundProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0A0A0A] dark:via-[#1A1A1A] dark:to-[#0F0F0F] relative overflow-hidden ${className}`}>
      {/* Background Image (optional, can be added per page) */}
      
      {/* Ambient Glows - Floating Animation */}
      <FloatingAmbientGlows />

      {/* Noise Texture */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

interface ThemedCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

export function ThemedCard({ children, className = "", hover = true }: ThemedCardProps) {
  return (
    <div className={`relative group ${className}`}>
      {/* Hover glow effect */}
      {hover && (
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#F46036] to-[#D74E25] rounded-2xl opacity-0 group-hover:opacity-20 dark:group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
      )}
      
      {/* Card */}
      <div className="relative bg-white/80 dark:bg-black/40 backdrop-blur-2xl dark:backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl dark:shadow-2xl overflow-hidden">
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 dark:via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        
        {/* Content */}
        <div className="relative">
          {children}
        </div>
      </div>
    </div>
  )
}

interface ThemedStatCardProps {
  label: string
  value: string | number
  subtext?: string
  icon: ReactNode
  iconBg?: "primary" | "secondary"
}

export function ThemedStatCard({ label, value, subtext, icon, iconBg = "secondary" }: ThemedStatCardProps) {
  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#F46036] to-[#D74E25] rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
      <div className="relative bg-white/80 dark:bg-black/40 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-lg dark:shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 dark:via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        
        <div className="relative flex items-center justify-between mb-4">
          <span className="text-sm font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{label}</span>
          <div className={`w-10 h-10 ${iconBg === "primary" ? "bg-gradient-to-br from-[#F46036]/20 to-[#D74E25]/20 border-[#F46036]/20" : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10"} backdrop-blur-sm border rounded-xl flex items-center justify-center`}>
            {icon}
          </div>
        </div>
        <div className="text-3xl font-heading font-bold text-slate-900 dark:text-white tracking-tight mb-2">{value}</div>
        {subtext && <p className="text-sm text-slate-600 dark:text-slate-400 font-body">{subtext}</p>}
      </div>
    </div>
  )
}


